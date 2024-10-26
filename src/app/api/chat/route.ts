import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ClarificationResponse {
  needs_clarification: boolean;
  questions: {
    id: number;
    question: string;
    category?: string;
  }[];
}

function validateEnvVariables() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  
  if (!process.env.OPENAI_MODEL) {
    console.warn('OPENAI_MODEL is not set, using default: gpt-3.5-turbo');
  }
}

async function checkIfClarificationNeeded(message: string) {
  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `入力された質問の曖昧さを判断し、以下の形式のJSONで返してください：
{
  "needs_clarification": true または false,
  "questions": [
    {
      "id": 1から始まる連番,
      "question": "確認したい質問文",
      "category": "質問のカテゴリ"
    }
  ]
}

needs_clarificationは、追加の質問が必要な場合はtrue、そうでない場合はfalseにしてください。
questionsは、needs_clarificationがtrueの場合のみ、具体的な質問を配列で含めてください。
questionsが空の場合は空配列[]を返してください。`
        },
        {
          role: "user",
          content: `次の質問を分析してください：\n"${message}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    // デバッグ用にレスポンスを出力
    console.log('OpenAI Response:', response.choices[0].message.content);

    let analysisJson: ClarificationResponse;
    try {
      analysisJson = JSON.parse(response.choices[0].message.content) as ClarificationResponse;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      // パース失敗時のフォールバック
      return {
        needsClarification: false,
        questions: []
      };
    }

    // 必須フィールドの存在確認と型チェック
    if (typeof analysisJson.needs_clarification !== 'boolean' || !Array.isArray(analysisJson.questions)) {
      console.error('Invalid JSON structure:', analysisJson);
      return {
        needsClarification: false,
        questions: []
      };
    }

    return {
      needsClarification: analysisJson.needs_clarification,
      questions: analysisJson.questions.map((q, index) => ({
        id: q.id || index + 1,
        question: q.question,
        category: q.category || '一般'
      }))
    };

  } catch (error) {
    console.error('Error in checkIfClarificationNeeded:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1].content;

    try {
      const clarification = await checkIfClarificationNeeded(lastMessage);
      console.log('Clarification result:', clarification); // デバッグ用

      if (clarification.needsClarification && clarification.questions.length > 0) {
        return NextResponse.json({
          needsClarification: true,
          questions: clarification.questions
        });
      }

      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "あなたは親切で丁寧なアシスタントです。ユーザーの質問に対して、できるだけ具体的で実用的な回答を提供してください。"
          },
          ...messages
        ],
        temperature: 0.7,
      });

      return NextResponse.json({
        content: chatCompletion.choices[0].message.content,
        needsClarification: false
      });

    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      return NextResponse.json(
        { 
          error: error.message,
          details: error.response?.data || 'No additional details'
        },
        { status: error.status || 500 }
      );
    }

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}