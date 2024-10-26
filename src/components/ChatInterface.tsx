'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ClarificationQuestion {
  id: number;
  question: string;
  category?: string;
  answer: string;
}

const ChatInterface = () => {
  // 基本的なstate
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 質問関連のstate
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<ClarificationQuestion[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // メッセージコンポーネント
  const MessageComponent = ({ message }: { message: Message }) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        className={`p-4 rounded-lg ${
          isUser
            ? 'bg-blue-100 ml-auto max-w-[80%]'
            : 'bg-gray-100 mr-auto max-w-[80%]'
        }`}
      >
        <div className="text-sm text-gray-600 mb-1">
          {isUser ? 'あなた' : 'AI'}
        </div>
        <div className="whitespace-pre-wrap text-gray-800">{message.content}</div>
      </div>
    );
  };

  // メッセージ送信ハンドラー
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const newMessage: Message = { role: 'user', content: input.trim() };
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, newMessage] })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'エラーが発生しました');
      }

      setMessages(prev => [...prev, newMessage]);
      
      if (data.needsClarification && data.questions) {
        setClarificationQuestions(
          data.questions.map((q: any, index: number) => ({
            id: index,
            question: q.question,
            category: q.category,
            answer: ''
          }))
        );
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.content }
        ]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  // 確認質問への回答送信ハンドラー
  const handleClarificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const allAnswered = clarificationQuestions.every(q => q.answer.trim());
    if (!allAnswered) {
      setError('すべての質問にお答えください。');
      return;
    }

    setIsLoading(true);
    setAnsweredQuestions([...clarificationQuestions]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages,
            {
              role: 'user',
              content: JSON.stringify({ clarifications: clarificationQuestions })
            }
          ]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'エラーが発生しました');
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.content }
      ]);
      setClarificationQuestions([]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* メッセージ履歴 */}
        <div className="space-y-4 mb-4 max-h-[60vh] overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className="w-full">
              <MessageComponent message={msg} />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 回答済みの質問表示 */}
        {answeredQuestions.length > 0 && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-bold mb-2 text-green-800">回答内容：</h3>
            {answeredQuestions.map((q, index) => (
              <div key={index} className="mb-2">
                <p className="text-green-700 font-medium">{q.question}</p>
                <p className="text-green-600 ml-4">{q.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* 確認質問フォーム */}
        {clarificationQuestions.length > 0 ? (
          <form onSubmit={handleClarificationSubmit} className="space-y-4">
            {clarificationQuestions.map((q) => (
              <div key={q.id} className="p-4 bg-yellow-50 rounded-lg">
                <label className="block mb-2 text-yellow-900">
                  {q.question}
                  {q.category && (
                    <span className="ml-2 px-2 py-1 text-xs bg-yellow-200 rounded-full">
                      {q.category}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={q.answer}
                  onChange={(e) => {
                    setClarificationQuestions(prev =>
                      prev.map(question =>
                        question.id === q.id
                          ? { ...question, answer: e.target.value }
                          : question
                      )
                    );
                  }}
                  className="w-full p-2 border rounded text-gray-800 bg-white"
                  placeholder="ここに回答を入力してください..."
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isLoading ? '送信中...' : '回答を送信'}
            </button>
          </form>
        ) : (
          // 通常の入力フォーム
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-2 border rounded text-gray-800 bg-white"
              placeholder="メッセージを入力..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isLoading ? '送信中...' : '送信'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;