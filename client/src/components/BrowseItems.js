const handlePayment = async (item) => {
    try {
        const API_BASE_URL = process.env.REACT_APP_API_URL;
        
        const commonHeaders = {
            "Content-Type": "application/json",
            "bypass-tunnel-reminder": "true" 
        };

        const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
            method: "POST",
            headers: commonHeaders,
            body: JSON.stringify({ 
                productId: item._id,
                itemName: item.itemName,
                price: Math.round(Number(item.price)),
                requesterId: localStorage.getItem('userId'),
                requesterName: localStorage.getItem('userName'),
                orderType: 'OUTGOING'
            })
        });

        if (!response.ok) throw new Error("Order creation failed on server.");
        const data = await response.json();
        
        const { razorpayOrder, orderId } = data;

        const options = {
            key: "rzp_test_SF9nc2yIVsOczO", 
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: "Treasure to Charity",
            description: `Donation for ${item.itemName}`,
            order_id: razorpayOrder.id,
            handler: async (paymentResponse) => {
                const verifyRes = await fetch(`${API_BASE_URL}/api/orders/verify`, {
                    method: "POST",
                    headers: commonHeaders,
                    body: JSON.stringify({ 
                        ...paymentResponse, 
                        orderId: orderId,
                        itemId: item._id,
                        selectedOrphanage: item.selectedOrphanageId || null 
                    })
                });

                if (verifyRes.ok) {
                    alert("Payment Successful! Your contribution has been recorded.");
                    window.location.reload(); 
                } else {
                    alert("Payment completed but verification failed. Please contact Admin.");
                }
            },
            prefill: { 
                name: localStorage.getItem('userName') || "User",
                email: localStorage.getItem('userEmail') || "user@example.com", 
                contact: localStorage.getItem('userPhone') || "9999999999" 
            },
            theme: { color: "#6f42c1" }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

    } catch (err) {
        console.error("Payment Process Error:", err);
        alert("Could not initiate payment. Please check your connection or Server status.");
    }
};