import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('🔍 [BACKEND] API Route: /api/ask-ai called at', new Date().toISOString());
  
  try {
    // Check if API key is configured
    console.log('🔑 [BACKEND] Checking OpenAI API key...');
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ [BACKEND] OPENAI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }
    console.log('✅ [BACKEND] OpenAI API key is configured (length:', process.env.OPENAI_API_KEY.length, ')');

    // Initialize OpenAI client
    console.log('🤖 [BACKEND] Initializing OpenAI client...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      timeout: 15000, // 15 seconds timeout
    });
    console.log('✅ [BACKEND] OpenAI client initialized');

    // Parse request body
    console.log('📥 [BACKEND] Parsing request body...');
    const body = await req.json();
    console.log('📥 [BACKEND] Received request body:', JSON.stringify(body, null, 2));
    
    const { prompt } = body;

    // Validate prompt
    console.log('🔍 [BACKEND] Validating prompt...');
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      console.error('❌ [BACKEND] Invalid or empty prompt received:', prompt);
      return NextResponse.json(
        { error: 'Invalid or empty prompt' },
        { status: 400 }
      );
    }
    console.log('✅ [BACKEND] Prompt validated:', prompt);

    console.log('🤖 [BACKEND] Sending prompt to OpenAI...');
    const openaiStartTime = Date.now();

    // Call OpenAI API with retry logic for timeouts
    let chatCompletion;
    let retries = 0;
    const maxRetries = 2;
    while (retries <= maxRetries) {
      try {
        chatCompletion = await openai.chat.completions.create({
          model: 'auto',
          messages: [
            { role: 'system', content: 'You are a helpful debate assistant bot.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
        });
        break; // Success, exit loop
      } catch (err: any) {
        if (err && err.message && err.message.includes('exceeded your current quota')) {
          return NextResponse.json(
            { error: 'You have exceeded your OpenAI quota. Please check your plan and billing settings.' },
            { status: 429 }
          );
        }
        if (err && err.message && err.message.toLowerCase().includes('timeout') && retries < maxRetries) {
          console.warn('⏳ [BACKEND] OpenAI request timed out, retrying...', retries + 1);
          retries++;
          continue;
        } else {
          throw err;
        }
      }
    }

    if (!chatCompletion) {
      console.error('❌ [BACKEND] Failed to get completion from OpenAI API after retries.');
      return NextResponse.json(
        { error: 'Failed to get AI response from OpenAI after retries' },
        { status: 500 }
      );
    }

    const openaiEndTime = Date.now();
    console.log('✅ [BACKEND] OpenAI response received in', openaiEndTime - openaiStartTime, 'ms');
    console.log('✅ [BACKEND] OpenAI response structure:', {
      choices: chatCompletion.choices?.length,
      usage: chatCompletion.usage,
      model: chatCompletion.model
    });

    const reply = chatCompletion.choices[0]?.message?.content;
    console.log('📝 [BACKEND] Extracted reply:', reply);
    
    if (!reply) {
      console.error('❌ [BACKEND] No reply content in OpenAI response');
      console.error('❌ [BACKEND] Full OpenAI response:', JSON.stringify(chatCompletion, null, 2));
      return NextResponse.json(
        { error: 'No response content from AI' },
        { status: 500 }
      );
    }

    const endTime = Date.now();
    console.log('📤 [BACKEND] Sending reply to frontend. Total time:', endTime - startTime, 'ms');
    console.log('📤 [BACKEND] Reply content:', reply);
    
    return NextResponse.json({ reply });

  } catch (error) {
    const endTime = Date.now();
    console.error('❌ [BACKEND] Error in /api/ask-ai after', endTime - startTime, 'ms:', error);
    console.error('❌ [BACKEND] Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        console.error('❌ [BACKEND] OpenAI API key is invalid');
        return NextResponse.json(
          { error: 'Invalid OpenAI API key' },
          { status: 401 }
        );
      }
      if (error.message.includes('429')) {
        console.error('❌ [BACKEND] OpenAI API rate limit exceeded');
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded' },
          { status: 429 }
        );
      }
      if (error.message.includes('500')) {
        console.error('❌ [BACKEND] OpenAI API server error');
        return NextResponse.json(
          { error: 'OpenAI API server error' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
