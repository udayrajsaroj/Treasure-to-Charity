import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const config = { headers: { "Content-Type": "application/json" } };

const Messages = () => {
    const [msg, setMsg] = useState({ subject: '', content: '' });
    const [history, setHistory] = useState([]);
    const [replyText, setReplyText] = useState({}); 
    const [loading, setLoading] = useState(true);

    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const fetchMessages = useCallback(async () => {
        try {
            const endpoint = userRole === 'Admin' 
                ? `${API_BASE_URL}/api/messages/all` 
                : `${API_BASE_URL}/api/messages/user/${userName}`;
            
            const res = await axios.get(endpoint, config);
            setHistory(res.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [userRole, API_BASE_URL, userName]); 

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const handleSend = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/api/messages/send`, {
                senderName: userName,
                senderRole: userRole,
                subject: msg.subject,
                content: msg.content
            }, config);
            
            alert('Inquiry Sent Successfully!');
            setMsg({ subject: '', content: '' });
            fetchMessages(); 
        } catch (err) {
            alert('Failed to send message.');
        }
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
        } catch (err) {
            alert('Failed to send reply.');
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2 style={{color: '#6f42c1', margin: 0}}>
                        {userRole === 'Admin' ? '📩 System Inquiries' : '💬 My Support Tickets'}
                    </h2>
                </div>

                {userRole !== 'Admin' && (
                    <div style={styles.formBox}>
                        <h4>New Inquiry</h4>
                        <form onSubmit={handleSend} style={styles.form}>
                            <input style={styles.input} placeholder="Subject" value={msg.subject} onChange={e => setMsg({...msg, subject: e.target.value})} required />
                            <textarea style={styles.textarea} placeholder="Describe your issue..." value={msg.content} onChange={e => setMsg({...msg, content: e.target.value})} required />
                            <button type="submit" style={styles.sendBtn}>Send Ticket</button>
                        </form>
                    </div>
                )}

                <div style={{marginTop: '30px'}}>
                    <h3>{userRole === 'Admin' ? 'Recent User Requests' : 'Communication History'}</h3>
                    {loading ? <p>Loading messages...</p> : (
                        history.length > 0 ? history.map(m => (
                            <div key={m._id} style={styles.msgCard}>
                                <div style={styles.cardHeader}>
                                    <strong>{m.subject}</strong>
                                    <span style={styles.date}>{new Date(m.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p style={styles.senderInfo}>By: {m.senderName} ({m.senderRole})</p>
                                <p style={styles.content}>{m.content}</p>

                                {m.replyContent && (
                                    <div style={styles.replyBox}>
                                        <strong>Admin Response:</strong>
                                        <p>{m.replyContent}</p>
                                        <small>Replied by {m.adminName || 'Admin'}</small>
                                    </div>
                                )}

                                {userRole === 'Admin' && !m.replyContent && (
                                    <div style={styles.adminAction}>
                                        <textarea 
                                            style={styles.replyInput} 
                                            placeholder="Write your reply..." 
                                            value={replyText[m._id] || ''} 
                                            onChange={e => setReplyText({...replyText, [m._id]: e.target.value})} 
                                        />
                                        <button onClick={() => handleAdminReply(m._id)} style={styles.replyBtn}>Reply ↵</button>
                                    </div>
                                )}
                            </div>
                        )) : <p>No records found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '40px', fontFamily: 'Segoe UI' },
    container: { maxWidth: '850px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '15px' },
    formBox: { background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '40px' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    input: { padding: '12px', border: '1px solid #ddd', borderRadius: '6px', outline: 'none' },
    textarea: { padding: '12px', border: '1px solid #ddd', borderRadius: '6px', height: '80px', resize: 'none' },
    sendBtn: { padding: '12px', backgroundColor: '#6f42c1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    msgCard: { border: '1px solid #eee', borderRadius: '10px', padding: '20px', marginBottom: '20px', position: 'relative' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    date: { fontSize: '12px', color: '#999' },
    senderInfo: { fontSize: '13px', color: '#666', margin: '0 0 10px 0' },
    content: { fontSize: '15px', color: '#333', lineHeight: '1.5' },
    replyBox: { marginTop: '15px', background: '#eefcf1', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #28a745' },
    adminAction: { marginTop: '15px', display: 'flex', gap: '10px' },
    replyInput: { flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '5px', height: '60px', fontSize: '14px' },
    replyBtn: { backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Messages;