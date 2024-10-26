import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent">
          ClarifyChat
        </h1>
        <ChatInterface />
      </div>
    </main>
  );
}