import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const config = { headers: { "Content-Type": "application/json" } };

const Messages = () => {
    const [msg, setMsg] = useState({ subject: '', content: '' });
    const [history, setHistory] = useState([]);
    const [replyText, setReplyText] = useState({});
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchMessages = useCallback(async () => {
        try {
            const endpoint = userRole === 'Admin'
                ? `${API_BASE_URL}/api/messages/all`
                : `${API_BASE_URL}/api/messages/user/${userName}`;
            const res = await axios.get(endpoint, config);
            setHistory(res.data);
        } catch (err) { console.error("Fetch Error:", err); }
        finally { setLoading(false); }
    }, [userRole, API_BASE_URL, userName]);

    useEffect(() => { fetchMessages(); }, [fetchMessages]);

    const handleSend = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/api/messages/send`, {
                senderName: userName, senderRole: userRole,
                subject: msg.subject, content: msg.content
            }, config);
            alert('Inquiry Sent Successfully!');
            setMsg({ subject: '', content: '' });
            fetchMessages();
        } catch (err) { alert('Failed to send message.'); }
    };

    const handleAdminReply = async (messageId) => {
        if (!replyText[messageId]) return alert("Please type a reply first!");
        try {
            await axios.put(`${API_BASE_URL}/api/messages/reply/${messageId}`, {
                replyContent: replyText[messageId],
                adminName: userName
            }, config);
            alert('Reply Sent!');
            setReplyText({ ...replyText, [messageId]: '' });
            fetchMessages();
        } catch (err) { alert('Failed to send reply.'); }
    };

    return (
        <div style={styles.page}>
            <div style={{
                ...styles.container,
                padding: isMobile ? '15px' : '30px',  // ✅ mobile pe kam padding
            }}>
                <div style={styles.header}>
                    <h2 style={{color: '#6f42c1', margin: 0, fontSize: isMobile ? '16px' : '20px'}}>
                        {userRole === 'Admin' ? '📩 System Inquiries' : '💬 My Support Tickets'}
                    </h2>
                </div>

                {/* New Inquiry Form */}
                {userRole !== 'Admin' && (
                    <div style={styles.formBox}>
                        <h4 style={{margin: '0 0 15px 0'}}>✉️ New Inquiry</h4>
                        <form onSubmit={handleSend} style={styles.form}>
                            <input
                                style={styles.input}
                                placeholder="Subject"
                                value={msg.subject}
                                onChange={e => setMsg({...msg, subject: e.target.value})}
                                required
                            />
                            <textarea
                                style={styles.textarea}
                                placeholder="Describe your issue..."
                                value={msg.content}
                                onChange={e => setMsg({...msg, content: e.target.value})}
                                required
                            />
                            <button type="submit" style={styles.sendBtn}>📤 Send Ticket</button>
                        </form>
                    </div>
                )}

                {/* Message History */}
                <div style={{marginTop: '20px'}}>
                    <h3 style={{fontSize: isMobile ? '14px' : '16px', color: '#444'}}>
                        {userRole === 'Admin' ? '📋 Recent User Requests' : '📁 Communication History'}
                    </h3>

                    {loading ? (
                        <p style={{textAlign: 'center', color: '#999'}}>Loading messages...</p>
                    ) : history.length > 0 ? history.map(m => (
                        <div key={m._id} style={styles.msgCard}>
                            {/* Card Header */}
                            <div style={{
                                ...styles.cardHeader,
                                flexDirection: isMobile ? 'column' : 'row',  // ✅ mobile pe column
                                gap: isMobile ? '4px' : '0',
                            }}>
                                <strong style={{fontSize: '14px'}}>{m.subject}</strong>
                                <span style={styles.date}>{new Date(m.createdAt).toLocaleDateString()}</span>
                            </div>

                            <p style={styles.senderInfo}>👤 {m.senderName} ({m.senderRole})</p>
                            <p style={styles.msgContent}>{m.content}</p>

                            {/* Admin Reply */}
                            {m.replyContent && (
                                <div style={styles.replyBox}>
                                    <strong>✅ Admin Response:</strong>
                                    <p style={{margin: '8px 0 5px'}}>{m.replyContent}</p>
                                    <small style={{color: '#555'}}>— {m.adminName || 'Admin'}</small>
                                </div>
                            )}

                            {/* Admin Reply Input */}
                            {userRole === 'Admin' && !m.replyContent && (
                                <div style={{
                                    ...styles.adminAction,
                                    flexDirection: isMobile ? 'column' : 'row',  // ✅ mobile pe column
                                }}>
                                    <textarea
                                        style={{...styles.replyInput, width: '100%'}}
                                        placeholder="Write your reply..."
                                        value={replyText[m._id] || ''}
                                        onChange={e => setReplyText({...replyText, [m._id]: e.target.value})}
                                    />
                                    <button
                                        onClick={() => handleAdminReply(m._id)}
                                        style={{
                                            ...styles.replyBtn,
                                            width: isMobile ? '100%' : 'auto',  // ✅ mobile pe full width
                                            padding: isMobile ? '12px' : '0 20px',
                                        }}
                                    >
                                        Reply ↵
                                    </button>
                                </div>
                            )}
                        </div>
                    )) : (
                        <p style={{textAlign: 'center', color: '#999', padding: '40px'}}>No records found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '15px', fontFamily: 'Segoe UI' },
    container: { maxWidth: '850px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '15px' },
    formBox: { background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    input: { padding: '12px', border: '1px solid #ddd', borderRadius: '6px', outline: 'none', fontSize: '14px', boxSizing: 'border-box', width: '100%' },
    textarea: { padding: '12px', border: '1px solid #ddd', borderRadius: '6px', height: '80px', resize: 'none', fontSize: '14px', boxSizing: 'border-box', width: '100%', fontFamily: 'inherit' },
    sendBtn: { padding: '12px', backgroundColor: '#6f42c1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
    msgCard: { border: '1px solid #eee', borderRadius: '10px', padding: '15px', marginBottom: '15px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
    date: { fontSize: '11px', color: '#999', flexShrink: 0 },
    senderInfo: { fontSize: '12px', color: '#666', margin: '0 0 8px 0' },
    msgContent: { fontSize: '14px', color: '#333', lineHeight: '1.5', margin: '0 0 10px 0' },
    replyBox: { marginTop: '12px', background: '#eefcf1', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #28a745', fontSize: '13px' },
    adminAction: { marginTop: '12px', display: 'flex', gap: '10px' },
    replyInput: { flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px', height: '60px', fontSize: '13px', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
    replyBtn: { backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }
};

export default Messages;