
import React, { useState } from 'react';
import axios from 'axios';
import config from './config';
import elasticLogo from './elastic_logo.png';
function RAGChatApp() {
  const indices = config.indicesList || [];

  const [selectedIndex, setSelectedIndex] = useState(indices[0] || {});
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!indices.length) {
    return <div style={{ padding: 20, color: 'red' }}>Error: No indices configured in config.js</div>;
  }

  const handleIndexChange = (e) => {
    const sel = indices.find((i) => i.name === e.target.value);
    setSelectedIndex(sel);
    setMessages([]);
    setQuery('');
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg = { role: 'user', text: query.trim() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    setQuery('');

    try {
      // Elasticsearch retrieval
      const esRes = await axios.post(
        `${config.elasticsearchBaseURL}/${selectedIndex.index}/_search`,
        {
          _source: [selectedIndex.semantic_field],
          query: {
            semantic: {
              field: selectedIndex.semantic_field,
              query: query.trim(),
            },
          },
        },
        { auth: config.elasticsearchAuth }
      );

      const hits = esRes.data.hits.hits || [];
      const contextStr = hits.map((h) => h._source[selectedIndex.semantic_field]).join('\n\n');

      // Azure LLM call
      const llmRes = await axios.post(
        config.azureOpenAIEndpoint,
        {
          messages: [
            { role: 'system', content: 'You are a helpful assistant that answers questions based on provided context. Tell me what part of the answer is from the context and if you know additional information from sources beyond the context, if there is more, where did it come from.  Could you also format the response with the concise Answer, and the word answer in bold, and then a From the context section, bold heading, and if there's additional info, in another section with a bold header.' },
            { role: 'user', content: `Context:\n${contextStr}\n\nQuestion: ${query.trim()}` }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        { headers: { 'api-key': config.azureOpenAIApiKey } }
      );

      const assistantMsg = {
        role: 'assistant',
        text: llmRes.data.choices[0].message.content,
        hits
      };

      setMessages((m) => [...m, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { role: 'assistant', text: 'Error processing your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <img src={elasticLogo} alt="Elastic Logo" style={styles.logo} />
        <h1 style={styles.title}>Example RAG App</h1>
        <select value={selectedIndex.name} onChange={handleIndexChange} style={styles.select}>
          {indices.map((opt) => (
            <option key={opt.name} value={opt.name}>{opt.name}</option>
          ))}
        </select>
      </header>

      <div style={styles.chatWindow}>
        {messages.map((msg, idx) => (
          <div key={idx} style={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}>
            <p style={styles.bubbleText}>{msg.text}</p>
            {msg.role === 'assistant' && msg.hits?.length > 0 && (
              <details style={styles.details}>
                <summary>Relative passages used as context</summary>
                <ul style={styles.contextList}>
                  {msg.hits.map((h, i) => (
                    <li key={i}>{h._source[selectedIndex.semantic_field]}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}

        {loading && (
          <div style={styles.assistantBubble}>
            <p style={styles.bubbleText}>
              Thinking<span style={styles.dot}>.</span><span style={styles.dot}>.</span><span style={styles.dot}>.</span>
            </p>
          </div>
        )}
      </div>

      <div style={styles.inputContainer}>
        <input
          style={styles.inputBox}
          placeholder="Ask your question..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <button style={styles.button} onClick={handleSend} disabled={!query.trim() || loading}>
          Send
        </button>
      </div>
    </div>
  );
}

// Inline styles for clarity
const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' },
  header: { display: 'flex', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #ccc' },
  logo: { width: 96, marginRight: 24 },
  title: { flexGrow: 1, fontSize: 20, margin: 0 },
  select: { marginLeft: 12, padding: '4px 8px', fontSize: 14 },
  chatWindow: { display: 'flex', flexDirection: 'column', flex: '0 1 auto', padding: '16px', overflowY: 'auto', backgroundColor: '#f5f5f7' },
  userBubble: { alignSelf: 'flex-end', textAlign: 'right', backgroundColor: '#e5e5ea', color: '#000', borderRadius: 16, padding: '8px 12px', margin: '4px 0', maxWidth: '40%', animation: 'fadeInUp 0.3s ease-in-out' },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#f1f1f1', color: '#000', borderRadius: 16, padding: '8px 12px', margin: '4px 0', maxWidth: '70%', animation: 'fadeIn 0.3s' },
  bubbleText: { margin: 0, whiteSpace: 'pre-wrap' },
  details: { marginTop: 8, fontSize: 14 },
  contextList: { marginTop: 4, marginLeft: 16 },
  inputContainer: { display: 'flex', padding: '8px 16px', borderTop: '1px solid #ccc' },
  inputBox: { flex: 1, padding: '8px 12px', borderRadius: 16, border: '1px solid #888', fontSize: 16 },
  button: { marginLeft: 8, padding: '8px 16px', backgroundColor: '#007aff', color: '#fff', border: 'none', borderRadius: 16, fontSize: 16, cursor: 'pointer' },
  dot: { animation: 'blink 1s infinite', marginLeft: 2 }
};

export default RAGChatApp;
