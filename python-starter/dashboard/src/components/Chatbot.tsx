import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare, Loader2 } from 'lucide-react';
import { queryChatbot } from '../api/customer360';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onReset?: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, onReset }) => {
  const initialMessage = {
    role: 'assistant' as const,
    content: 'Hello! I\'m your Customer 360 Assistant. I can help you understand your customer data!\n\nAsk me about:\n- Customer health and risk\n- Revenue and top customers\n- Regional distribution\n- Specific customer information\n\nWhat would you like to know?',
    timestamp: new Date()
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle click outside to minimize (not reset)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target as Node) && isOpen) {
        onClose(); // Just minimize, don't reset
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleCloseAndReset = () => {
    // Reset chat history
    setMessages([initialMessage]);
    setInput('');
    onClose();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare conversation history for API
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await queryChatbot(input.trim(), history);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={chatbotRef} className="fixed bottom-4 right-4 w-96 h-[600px] bg-white dark:bg-datacamp-dark-bg-contrast rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-datacamp-dark-bg-secondary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-datacamp-dark-bg-secondary bg-gradient-to-r from-datacamp-brand/10 to-datacamp-blue/10 dark:from-datacamp-brand/20 dark:to-datacamp-blue/20 rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-datacamp-brand" />
          <h3 className="font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
            Customer 360 Assistant
          </h3>
        </div>
        <button
          onClick={handleCloseAndReset}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Close and reset chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-datacamp-brand text-white'
                  : 'bg-gray-100 dark:bg-datacamp-dark-bg-secondary text-datacamp-text-primary dark:text-datacamp-dark-text-primary'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user'
                    ? 'text-white/70'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-datacamp-dark-bg-secondary rounded-lg p-3">
              <Loader2 className="h-5 w-5 animate-spin text-datacamp-brand" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-datacamp-dark-bg-secondary">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about customers, revenue, health scores..."
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-datacamp-dark-bg-secondary bg-white dark:bg-datacamp-dark-bg-main px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-datacamp-brand text-datacamp-text-primary dark:text-datacamp-dark-text-primary placeholder-gray-400 dark:placeholder-gray-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="self-end px-4 py-2 bg-datacamp-brand text-white rounded-lg hover:bg-datacamp-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
