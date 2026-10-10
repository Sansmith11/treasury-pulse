import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, X, BarChart3, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

export default function AICopilotChat({ isOpen, onClose, activeEntity, activeRegion }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello! I am your **Treasury Pulse AI Copilot**.\n\nI analyze rolling liquidity forecasts, counterparty risk ratings, cash surpluses, and simulation scenarios grounded directly in BNP Paribas live treasury data.\n\nHow can I assist your liquidity decisions today?`,
      timestamp: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const promptSuggestions = [
    "Why is there a shortfall in EUR next week?",
    "What-if we delay payments by 3 days?",
    "What's my surplus position in APAC?",
    "What action plan do you recommend?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          entity: activeEntity || 'BNPPARIBAS_PARIS',
          region: activeRegion !== 'ALL' ? activeRegion : null
        })
      });
      const data = await res.json();

      const botMsg = {
        sender: 'bot',
        text: data.response,
        chart_spec: data.chart_spec,
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "I encountered an issue communicating with the analytical core. Please try again.",
        timestamp: 'Error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderInlineChart = (spec) => {
    if (!spec) return null;
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { size: 10 } } }
      },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 9 } } },
        y: { ticks: { color: '#64748b', font: { size: 9 } } }
      }
    };

    return (
      <div style={{ marginTop: '12px', background: '#070d18', padding: '12px', borderRadius: '10px', border: '1px solid #1e2f52' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
          {spec.title}
        </div>
        <div style={{ height: '180px', position: 'relative' }}>
          {spec.type === 'line' && <Line data={{ labels: spec.labels, datasets: spec.datasets }} options={commonOptions} />}
          {spec.type === 'bar' && <Bar data={{ labels: spec.labels, datasets: spec.datasets }} options={commonOptions} />}
          {spec.type === 'doughnut' && <Doughnut data={{ labels: spec.labels, datasets: spec.datasets }} options={{ responsive: true, maintainAspectRatio: false }} />}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '460px',
      maxWidth: '100vw',
      background: '#0c1526',
      borderLeft: '1px solid #1e2f52',
      boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.6)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 90,
      animation: 'slideInRight 0.25s ease-out'
    }}>
      
      {/* Drawer Header */}
      <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid #1e2f52', background: '#111d35' }}>
        <div className="flex items-center gap-2">
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(0, 145, 90, 0.2)', color: '#00915a' }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
              Treasury Pulse AI Copilot
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              RAG Advisory & Strategic Decision Support
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      {/* Suggested Prompts */}
      <div style={{ padding: '12px 16px', background: '#070d18', borderBottom: '1px solid #1e2f52' }}>
        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600 }}>
          Suggested Treasury Inquiries
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {promptSuggestions.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              style={{
                background: '#111d35',
                border: '1px solid #1e2f52',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                color: '#cbd5e1',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              {m.sender === 'bot' ? <Bot size={13} color="#00915a" /> : <User size={13} color="#3b82f6" />}
              <span style={{ fontSize: '10px', color: '#64748b' }}>
                {m.sender === 'bot' ? 'Copilot' : 'You'} • {m.timestamp}
              </span>
            </div>

            <div style={{
              maxWidth: '90%',
              padding: '12px 14px',
              borderRadius: '12px',
              background: m.sender === 'user' ? '#1d4ed8' : '#111d35',
              color: '#f1f5f9',
              fontSize: '13px',
              lineHeight: 1.5,
              border: m.sender === 'user' ? 'none' : '1px solid #1e2f52',
              whiteSpace: 'pre-wrap'
            }}>
              {m.text}
              {m.chart_spec && renderInlineChart(m.chart_spec)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', padding: '8px' }}>
            <Sparkles size={14} className="animate-spin" color="#00915a" /> Analyzing liquidity models and RAG data...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div style={{ padding: '14px', borderTop: '1px solid #1e2f52', background: '#111d35' }}>
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <input 
            type="text" 
            placeholder="Ask about liquidity gaps, What-If delays, surplus..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', fontSize: '13px' }}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ padding: '10px 14px' }}
            disabled={loading}
          >
            <Send size={15} />
          </button>
        </form>
      </div>

    </div>
  );
}
