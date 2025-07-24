import React, { useState } from 'react';
import axios from 'axios';
import logo from './elastic_logo.png';
import config from './config';

const {
  elasticsearchBaseURL,
  elasticsearchAuth,
  azureOpenAIEndpoint,
  azureOpenAIApiKey
} = config;

const macTheme = {
  backgroundColor: '#f2f2f7',
  textColor: '#1c1c1e',
  borderColor: '#d1d1d6',
  buttonBg: '#007aff',
  buttonText: '#ffffff',
  inputBg: '#ffffff',
  inputText: '#000000',
  toggleBg: '#d1d1d6',
  toggleText: '#1c1c1e',
  headerBg: '#e5e5ea',
  headerText: '#1c1c1e',
};

function Accordion({ title, children, defaultOpen = false, theme }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1px solid ${theme.borderColor}`, borderRadius: 12, marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          textAlign: 'left',
          background: theme.headerBg,
          border: 'none',
          padding: '12px 16px',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: 16,
          color: theme.headerText,
          borderRadius: '12px 12px 0 0'
        }}
      >
        {title} {isOpen ? '▲' : '▼'}
      </button>
      {isOpen && <div style={{ padding: 16, color: theme.textColor }}>{children}</div>}
    </div>
  );
}

function ChatMessage({ username, timestamp, children, theme }) {
  const isUser = username === 'You';

  const containerStyle = {
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginBottom: 12,
    animation: 'fadeInBubble 0.3s ease-out',
  };

  const bubbleStyle = {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: 20,
    backgroundColor: isUser ? '#007aff' : '#e5e5ea',
    color: isUser ? '#ffffff' : '#000000',
    fontSize: 15,
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  };

  const timestampStyle = {
    fontSize: 11,
    color: '#8e8e93',
    textAlign: isUser ? 'right' : 'left',
    marginTop: 4,
  };

  return (
    <div style={containerStyle}>
      <div>
        <div style={bubbleStyle}>{children}</div>
        <div style={timestampStyle}>{new Date(timestamp).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}

function LoadingPlaceholder() {
  const lineStyle = {
    height: 14,
    backgroundColor: '#c7c7cc',
    borderRadius: 6,
    marginBottom: 10,
    animation: 'pulse 1.5s ease-in-out infinite',
  };
  return (
    <>
      <div style={{ ...lineStyle, width: '85%' }} />
      <div style={{ ...lineStyle, width: '75%' }} />
      <div style={{ ...lineStyle, width: '90%' }} />
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
          }
          @keyframes fadeInBubble {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </>
  );
}

export default function RAGChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [chatTopic, setChatTopic] = useState('starwars');

  const theme = macTheme;

  const getCurrentIndex = () => {
    return chatTopic === 'starwars'
      ? 'starwars-semantic-enriched'
      : 'bible-kjv-semantic-enriched';
  };

  const getCurrentField = () => {
    return chatTopic === 'starwars' ? 'paragraph' : 'verse';
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      username: 'You',
      timestamp: new Date().toISOString(),
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setLoadingMessage(true);

    try {
      const fieldName = getCurrentField();
      const indexName = getCurrentIndex();

      const esResponse = await axios.post(
        `${elasticsearchBaseURL}/${indexName}/_search`,
        {
          _source: [fieldName],
          query: {
            semantic: {
              field: fieldName,
              query: input.trim(),
            },
          },
        },
        { auth: elasticsearchAuth }
      );

      const hits = esResponse.data.hits.hits || [];
      const topDocs = hits.map((hit) => hit._source[fieldName]).join('\n');

      const azureResponse = await axios.post(
        azureOpenAIEndpoint,
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant that answers questions based on provided context. Tell me what part of the answer is from the context and if you know additional information from sources beyond the context, if there is more, where did it come from.',
            },
            { role: 'user', content: `Context:\n${topDocs}\n\nQuestion: ${input.trim()}` },
          ],
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': azureOpenAIApiKey,
          },
        }
      );

      const botAnswer = azureResponse.data.choices[0].message.content;

      const botMessage = {
        username: 'Assistant',
        timestamp: new Date().toISOString(),
        content: botAnswer,
        contextHits: hits,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMessage(false);
      setInput('');
    }
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '2rem auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "San Francisco", Roboto, Helvetica, Arial, sans-serif',
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        minHeight: '100vh',
        padding: '1rem',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: 20,
          backgroundColor: theme.headerBg,
          color: theme.headerText,
          padding: '1rem',
          borderRadius: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
      >
        <img
          src={logo}
          alt="RAG Chat Logo"
          style={{ maxWidth: 180, marginBottom: 0 }}
        />
        <div style={{ marginLeft: 16 }}>
          <label htmlFor="topic-select" style={{ fontWeight: 600, fontSize: 18, marginRight: 8 }}>
            Choose Topic:
          </label>
          <select
            id="topic-select"
            value={chatTopic}
            onChange={(e) => setChatTopic(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 16,
              border: `1px solid ${theme.borderColor}`,
              backgroundColor: theme.inputBg,
              color: theme.inputText,
            }}
          >
            <option value="starwars">STAR WARS Chat</option>
            <option value="bible">Bible Chat</option>
          </select>
        </div>
      </div>

      <div
        style={{
          minHeight: 200,
          marginBottom: 24,
          border: `1px solid ${theme.borderColor}`,
          padding: 16,
          borderRadius: 12,
          backgroundColor: theme.inputBg,
          overflowY: 'auto',
        }}
      >
        {messages.map(({ username, timestamp, content, contextHits }, i) => (
          <div key={i}>
            <ChatMessage username={username} timestamp={timestamp} theme={theme}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{content}</p>
            </ChatMessage>

            {username === 'Assistant' && contextHits && contextHits.length > 0 && (
              <Accordion
                title={`Relative passages used as context (${contextHits.length})`}
                defaultOpen={false}
                theme={theme}
              >
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {contextHits.map((hit, idx) => (
                    <li
                      key={idx}
                      style={{ marginBottom: 8, whiteSpace: 'pre-wrap', color: theme.textColor }}
                    >
                      {hit._source[getCurrentField()]}
                    </li>
                  ))}
                </ul>
              </Accordion>
            )}
          </div>
        ))}

        {loadingMessage && (
          <ChatMessage username="Assistant" timestamp={new Date().toISOString()} theme={theme}>
            <LoadingPlaceholder />
          </ChatMessage>
        )}
      </div>

      <div style={{ display: 'flex', marginTop: 20 }}>
        <input
          type="text"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{
            flexGrow: 1,
            padding: '12px 16px',
            fontSize: 16,
            borderRadius: 12,
            border: `1px solid ${theme.borderColor}`,
            marginRight: 8,
            backgroundColor: theme.inputBg,
            color: theme.inputText,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: '12px 20px',
            fontSize: 16,
            borderRadius: 12,
            border: 'none',
            backgroundColor: theme.buttonBg,
            color: theme.buttonText,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

