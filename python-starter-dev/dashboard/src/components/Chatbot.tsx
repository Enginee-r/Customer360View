import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare, Loader2 } from 'lucide-react';
import { queryChatbot, getAllCustomers } from '../api/customer360';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Customer {
  account_id: string;
  account_name: string;
  region: string;
  health_status: string;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onReset?: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, onReset }) => {
  const initialMessage = {
    role: 'assistant' as const,
    content: 'Hello! I\'m your One Cassava Customer 360 Assistant. I can help you understand your customer data!\n\nAsk me about:\n- Customer health and risk\n- Revenue and top customers\n- Regional distribution\n- Satisfaction metrics (NPS, CSAT, CES, CLV)\n- Specific customer information\n\nWhat would you like to know?',
    timestamp: new Date()
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format message content: convert **text** to <strong>text</strong>
  const formatMessageContent = (content: string): string => {
    return content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customerList = await getAllCustomers();
        setCustomers(customerList);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      }
    };
    fetchCustomers();
  }, []);

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

  // Handle input change and detect @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    setInput(value);

    // Find the last @ before cursor position
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      // Check if there's a space or newline after the @
      const textAfterAt = textBeforeCursor.substring(lastAtPos + 1);
      const hasSpaceAfter = textAfterAt.includes(' ') || textAfterAt.includes('\n');

      if (!hasSpaceAfter) {
        // Show mentions dropdown
        setMentionStartPos(lastAtPos);
        const query = textAfterAt.toLowerCase();

        const filtered = customers.filter(c =>
          c.account_name.toLowerCase().includes(query)
        );

        setFilteredCustomers(filtered);
        setShowMentions(filtered.length > 0);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Handle customer selection from dropdown
  const selectCustomer = (customer: Customer) => {
    if (mentionStartPos === null) return;

    const beforeMention = input.substring(0, mentionStartPos);
    const afterMention = input.substring(textareaRef.current?.selectionStart || input.length);

    setInput(`${beforeMention}@${customer.account_name} ${afterMention}`);
    setShowMentions(false);
    setMentionStartPos(null);

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
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
    // Handle mention dropdown navigation
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev =>
          prev < filteredCustomers.length - 1 ? prev + 1 : prev
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev > 0 ? prev - 1 : 0));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (filteredCustomers[selectedMentionIndex]) {
          selectCustomer(filteredCustomers[selectedMentionIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    // Normal send on Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={chatbotRef} className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 h-[600px] max-h-[80vh] bg-white dark:bg-datacamp-dark-bg-contrast rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-datacamp-dark-bg-secondary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-datacamp-dark-bg-secondary bg-gradient-to-r from-datacamp-brand/10 to-datacamp-blue/10 dark:from-datacamp-brand/20 dark:to-datacamp-blue/20 rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-datacamp-brand" />
          <h3 className="font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
            One Cassava Customer 360 Assistant
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
              <div
                className="text-sm whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
              />
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
      <div className="p-4 border-t border-gray-200 dark:border-datacamp-dark-bg-secondary relative">
        {/* Mentions Dropdown */}
        {showMentions && filteredCustomers.length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-2 max-h-60 overflow-y-auto bg-white dark:bg-datacamp-dark-bg-secondary rounded-lg shadow-lg border border-gray-200 dark:border-datacamp-dark-bg-contrast">
            <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-datacamp-dark-bg-contrast">
              Select a customer (↑↓ to navigate, Enter to select)
            </div>
            {filteredCustomers.map((customer, index) => (
              <div
                key={customer.account_id}
                onClick={() => selectCustomer(customer)}
                className={`px-3 py-2 cursor-pointer transition-colors ${
                  index === selectedMentionIndex
                    ? 'bg-datacamp-brand/10 dark:bg-datacamp-brand/20'
                    : 'hover:bg-gray-100 dark:hover:bg-datacamp-dark-bg-main'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                      {customer.account_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {customer.region}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      customer.health_status === 'Healthy'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : customer.health_status === 'At-Risk'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {customer.health_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about customers, revenue, health scores... (Type @ to mention a customer)"
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
