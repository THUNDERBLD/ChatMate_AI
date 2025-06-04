import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, ChevronUp, Key, Copy, X, AlertCircle } from 'lucide-react';

interface Suggestion {
  id: number;
  text: string;
}

interface ApiKey {
  id: number;
  name: string;
  key: string;
  provider: string;
}

type MoodType = 'good' | 'angry' | 'sarcastic' | 'romcom' | 'cool' | 'rizz' | 'formal' | 'relationship';

const Layout: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<MoodType>('good');
  const [inputMessage, setInputMessage] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiProvider, setNewApiProvider] = useState('Gemini');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<string>('');
  
  const moodDropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const moods = [
    { value: 'good', label: '😊 Good', icon: '😊' },
    { value: 'angry', label: '😠 Angry', icon: '😠' },
    { value: 'sarcastic', label: '😏 Sarcastic', icon: '😏' },
    { value: 'romcom', label: '💕 Romantic', icon: '💕' },
    { value: 'cool', label: '😎 Cool', icon: '😎' },
    { value: 'rizz', label: '🔥 Rizz', icon: '🔥' },
    { value: 'formal', label: '👔 Formal', icon: '👔' },
    { value: 'relationship', label: '💝 Relationship Helper', icon: '💝' }
  ];

  // Handle clicks outside mood dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moodDropdownRef.current && !moodDropdownRef.current.contains(event.target as Node)) {
        setShowMoodDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputMessage]);

  // Get mood-specific prompt
  const getMoodPrompt = (mood: MoodType, message: string): string => {
    const moodPrompts = {
      good: `Generate 4 friendly and positive response suggestions for this message: "${message}". Make them warm, supportive, and encouraging.`,
      angry: `Generate 4 assertive but controlled response suggestions for this message: "${message}". Make them firm but not aggressive, expressing frustration constructively.`,
      sarcastic: `Generate 4 witty and sarcastic response suggestions for this message: "${message}". Make them clever and humorous but not mean-spirited.`,
      romcom: `Generate 4 romantic and sweet response suggestions for this message: "${message}". Make them loving, affectionate, and relationship-focused.`,
      cool: `Generate 4 casual and laid-back response suggestions for this message: "${message}". Make them relaxed, confident, and effortlessly cool.`,
      rizz: `Generate 4 charming and flirtatious response suggestions for this message: "${message}". Make them smooth, confident, and attractive.`,
      formal: `Generate 4 professional and formal response suggestions for this message: "${message}". Make them polite, respectful, and business-appropriate.`,
      relationship: `Generate 4 relationship-focused response suggestions for this message: "${message}". Make them thoughtful, caring, and aimed at strengthening the relationship.`
    };
    return moodPrompts[mood];
  };

  // Call Gemini API with multiple model fallbacks
  const callGeminiAPI = async (prompt: string, apiKey: string): Promise<string[]> => {
    // List of models to try in order
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro'
    ];

    const endpoints = ['v1beta', 'v1'];

    for (const endpoint of endpoints) {
      for (const model of modelsToTry) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/${endpoint}/models/${model}:generateContent?key=${apiKey}`;
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt + "\n\nPlease provide exactly 4 different response options, each on a new line starting with a number (1., 2., 3., 4.)."
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
              const text = data.candidates[0].content.parts[0].text;
              
              // Parse the response to extract individual suggestions
              const suggestions = text
                .split('\n')
                .filter((line: string) => line.trim().match(/^\d+\./))
                .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
                .filter((suggestion: string) => suggestion.length > 0);

              return suggestions.length >= 4 ? suggestions.slice(0, 4) : suggestions;
            }
          } else if (response.status !== 404) {
            // If it's not a 404, throw the error immediately
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            
            if (response.status === 400) {
              errorMessage = 'Invalid API key or request format. Please check your Gemini API key.';
            } else if (response.status === 403) {
              errorMessage = 'API key access denied. Please verify your Gemini API key permissions.';
            } else if (response.status === 429) {
              errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
            }
            
            if (errorData.error?.message) {
              errorMessage += ` Details: ${errorData.error.message}`;
            }
            
            throw new Error(errorMessage);
          }
          
          // Continue to next model if 404
        } catch (error) {
          if (error instanceof Error && !error.message.includes('fetch')) {
            throw error; // Re-throw non-network errors
          }
          // Continue to next model for network errors
        }
      }
    }

    // If all models failed, throw a comprehensive error
    throw new Error('No available Gemini models found. Please check your API key and ensure the Generative Language API is enabled in your Google Cloud Console.');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Check if we have a Gemini API key
    const geminiKey = apiKeys.find(key => key.provider.toLowerCase().includes('gemini'));
    if (!geminiKey) {
      setError('Please add a Gemini API key first');
      setShowApiKeyInput(true);
      return;
    }
    
    setIsLoading(true);
    setIsFirstLoad(false);
    setError('');
    setSuggestions([]);
    
    try {
      const prompt = getMoodPrompt(selectedMood, inputMessage);
      const apiSuggestions = await callGeminiAPI(prompt, geminiKey.key);
      
      if (apiSuggestions.length === 0) {
        throw new Error('No suggestions received from API');
      }
      
      const formattedSuggestions: Suggestion[] = apiSuggestions.map((text, index) => ({
        id: index + 1,
        text: text
      }));
      
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate suggestions');
      
      // Fallback to mock data if API fails
      const mockSuggestions: Suggestion[] = [
        { id: 1, text: "I understand what you're saying. Let me think about this." },
        { id: 2, text: "That's an interesting point. Could you tell me more?" },
        { id: 3, text: "Thanks for sharing that with me. I appreciate your perspective." },
        { id: 4, text: "I see where you're coming from. Let's discuss this further." }
      ];
      setSuggestions(mockSuggestions);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
    setShowMoodDropdown(false);
  };

  const handleAddApiKey = () => {
    if (newApiKey.trim() && newApiProvider.trim()) {
      const newKey: ApiKey = {
        id: Date.now(),
        name: newApiProvider,
        key: newApiKey,
        provider: newApiProvider
      };
      setApiKeys([...apiKeys, newKey]);
      setNewApiKey('');
      setNewApiProvider('Gemini');
      setShowApiKeyInput(false);
      setError('');
    }
  };

  const removeApiKey = (id: number) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };

  const selectedMoodData = moods.find(mood => mood.value === selectedMood);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between py-2 px-3 border-b border-gray-700">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center">
            <Send size={18} />
          </div>
          <h1 className="ml-3 text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
            ChatMate AI
          </h1>
        </div>
        <div className="text-xs flex items-center px-3 py-1 rounded-full bg-gray-700/50 backdrop-blur-sm">
          <span className="text-gray-300">Current mood:</span>
          <span className="ml-1 text-blue-300">{selectedMoodData?.icon} {selectedMoodData?.label.split(' ').slice(1).join(' ')}</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 px-4 py-2 flex items-center">
          <AlertCircle size={16} className="text-red-400 mr-2" />
          <span className="text-red-300 text-sm">{error}</span>
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 relative">
        {isFirstLoad ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="relative mb-8">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-500/10 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-indigo-500/10 rounded-full animate-pulse"></div>
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-5xl relative z-10">
                💬
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-200">
              Intelligent Communication Companion
            </h2>
            <p className="text-gray-400 mb-4">
              Paste any message below and receive AI-powered response suggestions tailored to your mood and context
            </p>
            {apiKeys.length === 0 && (
              <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 mb-4">
                <p className="text-amber-300 text-sm flex items-center">
                  <Key size={14} className="mr-2" />
                  Add your Gemini API key to get started
                </p>
              </div>
            )}
            <div className="flex space-x-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        ) : suggestions.length === 0 && !isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4 animate-pulse">✨</div>
              <h2 className="text-2xl font-bold mb-2 text-white">Generating responses</h2>
              <p className="text-lg mb-1">Your AI suggestions will appear here shortly</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-gradient-to-br from-gray-800/80 to-gray-800 backdrop-blur-sm rounded-xl p-5 cursor-pointer transition-all duration-200 border border-gray-700/50 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 relative overflow-hidden"
                onClick={() => copyToClipboard(suggestion.text, suggestion.id)}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                <div className="flex items-start">
                  <div className="bg-blue-500/10 p-2 rounded-lg mr-3">
                    <div className="bg-gradient-to-r from-blue-400 to-indigo-400 w-6 h-6 rounded-md flex items-center justify-center">
                      <Send size={12} />
                    </div>
                  </div>
                  <p className="text-gray-100 flex-1 pr-3 text-left">
                    {suggestion.text}
                  </p>
                  <div className={`text-xs text-gray-300 bg-gray-700/60 px-3 py-2 rounded-lg flex items-center transition-all ${
                    copiedId === suggestion.id ? 'bg-green-500/20 text-green-300' : ''
                  }`}>
                    {copiedId === suggestion.id ? (
                      <>
                        <Copy size={12} className="mr-1" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} className="mr-1" /> Click to copy
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-300">Generating tailored suggestions with Gemini AI...</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 max-w-md">
                  <div className="h-2 bg-gray-700/50 rounded-full animate-pulse"></div>
                  <div className="h-2 bg-gray-700/50 rounded-full animate-pulse"></div>
                  <div className="h-2 bg-gray-700/50 rounded-full animate-pulse"></div>
                  <div className="h-2 bg-gray-700/50 rounded-full animate-pulse"></div>
                  <div className="h-2 bg-gray-700/50 rounded-full animate-pulse col-span-2"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Input Area */}
      <div className="backdrop-blur-sm">
        <div className="max-w-3xl mx-auto p-4">
          {/* API Key Input (when shown) */}
          {showApiKeyInput && (
            <div className="mb-4 p-4 bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700/50 relative">
              <button 
                onClick={() => setShowApiKeyInput(false)}
                className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700/50"
              >
                <X size={18} />
              </button>
              
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                <Key size={16} className="mr-2 text-blue-400" /> Add Gemini API Key
              </h3>
              <div className="text-xs text-gray-400 mb-3">
                Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>
                <br />
                <span className="text-amber-300">⚠️ Make sure to enable the Gemini API in your Google Cloud Console</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="API Provider (e.g., Gemini)"
                  value={newApiProvider}
                  onChange={(e) => setNewApiProvider(e.target.value)}
                  className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <input
                  type="password"
                  placeholder="API Key"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  onClick={handleAddApiKey}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg font-medium transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/30"
                >
                  Add Key
                </button>
              </div>
              
              {apiKeys.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700/30">
                  <h4 className="text-xs text-gray-400 mb-2">CONFIGURED KEYS</h4>
                  <div className="space-y-2">
                    {apiKeys.map(key => (
                      <div key={key.id} className="flex items-center justify-between bg-gray-700/30 p-2 rounded-lg">
                        <div className="flex items-center">
                          <Key size={12} className="text-blue-400 mr-2" />
                          <span className="text-xs">{key.provider}</span>
                          <span className="text-xs text-gray-500 ml-2">••••{key.key.slice(-4)}</span>
                        </div>
                        <button 
                          onClick={() => removeApiKey(key.id)}
                          className="text-gray-500 hover:text-red-400 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Input Area */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Paste their message here..."
              className="w-full p-4 pr-32 bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none min-h-[60px] transition-all"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            
            {/* Bottom Controls */}
            <div className="absolute bottom-4 right-3 flex items-center space-x-2">
              {/* Plus Button for API Keys */}
              <button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                title="Manage API Keys"
              >
                <Plus size={18} />
              </button>

              {/* Moods Button */}
              <div className="relative" ref={moodDropdownRef}>
                <button
                  onClick={() => setShowMoodDropdown(!showMoodDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-sm backdrop-blur-sm"
                >
                  <span>Moods</span>
                  <ChevronUp 
                    size={14} 
                    className={`transform transition-transform ${showMoodDropdown ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Moods Dropdown */}
                {showMoodDropdown && (
                  <div className="absolute bottom-full right-0 mb-2 w-56 bg-gray-800/80 border border-gray-700/50 rounded-xl shadow-xl overflow-hidden z-10">
                    <div className="p-2 border-b border-gray-700/30">
                      <h4 className="text-xs text-gray-400 px-2 py-1">SELECT MOOD</h4>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {moods.map((mood) => (
                        <button
                          key={mood.value}
                          onClick={() => handleMoodSelect(mood.value as MoodType)}
                          className={`w-full text-left px-3 py-2.5 hover:bg-gray-700/50 transition-colors flex items-center space-x-3 ${
                            selectedMood === mood.value ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300'
                          }`}
                        >
                          <span className="text-xl">{mood.icon}</span>
                          <span className="text-sm">{mood.label.split(' ').slice(1).join(' ')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`p-3 rounded-full transition-all ${
                  !inputMessage.trim() || isLoading 
                    ? 'bg-gray-700 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;