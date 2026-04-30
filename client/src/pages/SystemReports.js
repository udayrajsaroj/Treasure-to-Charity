import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const SystemReports = () => {
    const [reportData, setReportData] = useState({
        totalUsers: 0, 
        totalItems: 0, 
        approvedItems: 0, 
        pendingItems: 0, 
        completedOrders: 0, 
        totalCharityValue: 0 
    });
    const [loading, setLoading] = useState(true);
    const pdfRef = useRef(null);
    const API_BASE_URL = process.env.REACT_APP_API_URL;
    const userName = "Udayraj Saroj"; 
    const reportDate = new Date().toLocaleDateString('en-GB');
    const COLORS = ['#6f42c1', '#28a745', '#ffc107', '#dc3545', '#007bb5'];

    useEffect(() => {
        const fetchReportData = async () => {
            const config = { headers: { "Content-Type": "application/json" } };
            try {
                const [usersRes, pendingRes, ordersRes, productsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/users/count`, config),
                    axios.get(`${API_BASE_URL}/api/products/pending`, config),
                    axios.get(`${API_BASE_URL}/api/orders/all`, config),
                    axios.get(`${API_BASE_URL}/api/products/all`, config)
                ]);

                const allOrders = ordersRes.data || [];
                const allProducts = productsRes.data || [];
                const uniqueDonations = allOrders.filter(o => o.orderType === 'OUTGOING');

                setReportData({
                    totalUsers: usersRes.data.totalUsers || 0,
                    totalItems: allProducts.length,
                    approvedItems: allProducts.filter(p => !['pending', 'rejected'].includes(p.status?.toLowerCase())).length,
                    pendingItems: pendingRes.data.length || 0,
                    completedOrders: uniqueDonations.filter(o => 
                        ['delivered', 'completed', 'settled', 'success'].includes((o.status || '').toLowerCase())
                    ).length,
                    totalCharityValue: uniqueDonations.reduce((sum, o) => sum + (Number(o.originalPrice) || 0), 0)
                });
            } catch (err) { 
                console.error(err); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchReportData();
    }, [API_BASE_URL]);

    const handleDownload = useCallback(() => {
        const element = pdfRef.current;
        if (!element) return;
        const opt = {
            margin: [10, 5, 10, 5],
            filename: `TTC_Impact_Report_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true, letterRendering: true, width: 800, windowWidth: 800 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    }, []);

    const donationStatusData = [
        { name: 'Approved', value: reportData.approvedItems },
        { name: 'Pending', value: reportData.pendingItems },
    ];

    const performanceData = [
        { name: 'Total', count: reportData.totalItems },
        { name: 'Fulfilled', count: reportData.completedOrders },
    ];

    if (loading) return <div style={styles.loading}>📡 Synchronizing Live Impact Metrics...</div>;

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>💎 Platform Analytics Dashboard</h2>
                        <p style={styles.subtitle}>Welcome back, {userName} | {reportDate}</p>
                    </div>
                    <button onClick={handleDownload} style={styles.downloadBtn}>📥 Download Premium PDF</button>
                </div>

                <div style={styles.reportGrid}>
                    <div style={styles.statCard}>
                        <span style={styles.emoji}>👥</span>
                        <h4 style={styles.cardLabel}>Total Users</h4>
                        <p style={styles.statNumber}>{reportData.totalUsers}</p>
                    </div>
                    <div style={styles.statCard}>
                        <span style={styles.emoji}>📦</span>
                        <h4 style={styles.cardLabel}>Donations</h4>
                        <p style={styles.statNumber}>{reportData.totalItems}</p>
                    </div>
                    <div style={{...styles.statCard, borderBottom: '3px solid #28a745'}}>
                        <span style={styles.emoji}>✅</span>
                        <h4 style={styles.cardLabel}>Fulfilled</h4>
                        <p style={{...styles.statNumber, color: '#28a745'}}>{reportData.completedOrders}</p>
                    </div>
                    <div style={{...styles.statCard, borderBottom: '3px solid #6f42c1', background: '#f9f5ff'}}>
                        <span style={styles.emoji}>🌟</span>
                        <h4 style={styles.cardLabel}>Social Value</h4>
                        <p style={{...styles.statNumber, color: '#6f42c1'}}>₹{reportData.totalCharityValue.toLocaleString()}</p>
                    </div>
                </div>

                <div style={styles.chartWrapper}>
                    <div style={styles.chartBox}>
                        <h5 style={styles.chartTitle}>📊 Approval Ratio</h5>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={donationStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                                    {donationStatusData.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={styles.chartBox}>
                        <h5 style={styles.chartTitle}>🚀 Fulfillment Performance</h5>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#6f42c1" radius={[5, 5, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={styles.infoBox}>
                    <strong>📝 System Summary:</strong>
                    <p style={{margin:'5px 0 0 0', fontSize:'13px'}}>Verified social impact of ₹{reportData.totalCharityValue.toLocaleString()} generated through {reportData.completedOrders} successful transactions across {reportData.totalUsers} stakeholders.</p>
                </div>
            </div>

            <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
                <div ref={pdfRef} style={pdfStyles.container}>
                    <div style={pdfStyles.headerBanner}>
                        <h1 style={pdfStyles.pdfTitle}>TREASURE TO CHARITY</h1>
                        <p style={pdfStyles.pdfSub}>Official Social Impact & Analytics Report</p>
                    </div>

                    <div style={pdfStyles.metaRow}>
                        <div><strong>DATE:</strong> {reportDate}</div>
                        <div><strong>ADMIN:</strong> {userName}</div>
                    </div>

                    <h3 style={pdfStyles.sectionHeading}>PLATFORM IMPACT SUMMARY</h3>

                    <div style={pdfStyles.pdfCardGrid}>
                        <div style={{...pdfStyles.pdfCard, borderTop: '4px solid #6f42c1'}}><span style={pdfStyles.pdfLabel}>Total Users</span><span style={pdfStyles.pdfValue}>{reportData.totalUsers}</span></div>
                        <div style={{...pdfStyles.pdfCard, borderTop: '4px solid #ffc107'}}><span style={pdfStyles.pdfLabel}>Donations</span><span style={pdfStyles.pdfValue}>{reportData.totalItems}</span></div>
                        <div style={{...pdfStyles.pdfCard, borderTop: '4px solid #28a745'}}><span style={pdfStyles.pdfLabel}>Fulfilled</span><span style={pdfStyles.pdfValue}>{reportData.completedOrders}</span></div>
                        <div style={{...pdfStyles.pdfCard, borderTop: '4px solid #007bb5'}}><span style={pdfStyles.pdfLabel}>Social Value</span><span style={{...pdfStyles.pdfValue, color: '#007bb5'}}>₹{reportData.totalCharityValue.toLocaleString()}</span></div>
                    </div>

                    <div style={pdfStyles.chartRow}>
                        <div style={pdfStyles.chartContainer}>
                            <p style={pdfStyles.chartTitle}>Approval Distribution</p>
                            <PieChart width={320} height={200}>
                                <Pie data={donationStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value">
                                    {donationStatusData.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
                                </Pie>
                                <Legend verticalAlign="bottom" align="center" iconSize={10} wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                            </PieChart>
                        </div>
                        <div style={pdfStyles.chartContainer}>
                            <p style={pdfStyles.chartTitle}>Fulfillment Performance</p>
                            <BarChart width={320} height={200} data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fontSize: 10}} />
                                <YAxis allowDecimals={false} tick={{fontSize: 10}} />
                                <Bar dataKey="count" fill="#6f42c1" barSize={35} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </div>
                    </div>

                    <div style={pdfStyles.footer}>
                        <p style={pdfStyles.certifyText}>"This document certifies the verified social impact generated by the Treasure to Charity platform in supporting community welfare through automated aid distribution protocols."</p>
                        <div style={pdfStyles.sigBox}>
                            <div style={pdfStyles.sigLine}></div>
                            <p style={{margin: '5px 0', fontSize: '16px', fontWeight: 'bold'}}>{userName}</p>
                            <p style={{margin: 0, fontSize: '11px', color: '#6f42c1', fontWeight: 'bold'}}>Authorized System Administrator</p>
                        </div>
                        <p style={pdfStyles.bottomStamp}>COMPUTER GENERATED OFFICIAL REPORT | © 2026 TREASURE TO CHARITY</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '20px' },
    container: { maxWidth: '1000px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '15px' },
    title: { margin: 0, color: '#2c3e50', fontSize: '24px' },
    subtitle: { margin: '5px 0 0 0', fontSize: '12px', color: '#6f42c1', fontWeight: 'bold' },
    downloadBtn: { background: '#6f42c1', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    reportGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' },
    statCard: { padding: '20px', background: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', textAlign: 'center' },
    statNumber: { fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0' },
    cardLabel: { fontSize: '11px', color: '#666', textTransform: 'uppercase' },
    emoji: { fontSize: '20px' },
    chartWrapper: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
    chartBox: { flex: 1, minWidth: '350px', background: '#fafafa', padding: '20px', borderRadius: '12px', border: '1px solid #eee' },
    chartTitle: { textAlign: 'center', marginBottom: '15px', color: '#555', fontSize: '14px' },
    infoBox: { backgroundColor: '#f0f7ff', padding: '20px', borderRadius: '12px', borderLeft: '6px solid #6f42c1', marginTop: '20px' },
    loading: { textAlign: 'center', padding: '100px', fontSize: '18px', color: '#6f42c1', fontWeight: 'bold' }
};

const pdfStyles = {
    container: { width: '800px', padding: '40px', backgroundColor: '#fff', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    headerBanner: { textAlign: 'center', marginBottom: '30px', borderBottom: '4px solid #6f42c1', paddingBottom: '20px', width: '100%' },
    pdfTitle: { fontSize: '32px', margin: 0, color: '#2c3e50', letterSpacing: '1px' },
    pdfSub: { fontSize: '16px', color: '#6f42c1', margin: '5px 0 0 0', fontWeight: 'bold' },
    metaRow: { display: 'flex', justifyContent: 'center', gap: '60px', marginBottom: '30px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', fontSize: '13px', color: '#555', width: '90%' },
    sectionHeading: { fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '20px', textAlign: 'center', width: '100%' },
    pdfCardGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '40px', width: '100%' },
    pdfCard: { padding: '15px', background: '#fff', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center' },
    pdfLabel: { display: 'block', fontSize: '10px', color: '#666', marginBottom: '5px' },
    pdfValue: { fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' },
    chartRow: { display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '50px', width: '100%' },
    chartContainer: { padding: '15px', border: '1px solid #f4f4f4', borderRadius: '10px', textAlign: 'center', backgroundColor: '#fafafa' },
    chartTitle: { fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#444' },
    footer: { marginTop: '30px', textAlign: 'center', width: '100%' },
    certifyText: { fontSize: '12px', fontStyle: 'italic', color: '#666', marginBottom: '40px', padding: '0 80px', lineHeight: '1.6' },
    sigBox: { display: 'inline-block', width: '350px', textAlign: 'center' },
    sigLine: { borderTop: '2px solid #333', marginBottom: '10px' },
    bottomStamp: { marginTop: '50px', fontSize: '10px', color: '#ccc', textAlign: 'center', letterSpacing: '1px' }
};

export default SystemReports;