document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = '/index.html';
      return;
    }
    
    // Send form
    const sendForm = document.getElementById('sendForm');
    if (sendForm) {
      sendForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('sendAmount').value);
        const recipientAddress = document.getElementById('recipientAddress').value;
        
        if (isNaN(amount) || amount <= 0) {
          alert('Please enter a valid amount');
          return;
        }
        
        if (!recipientAddress.startsWith('CBZ-')) {
          alert('Invalid Cobraz address');
          return;
        }
        
        // Find recipient by address
        const usersSnapshot = await db.collection('users')
          .where('cobrazAddress', '==', recipientAddress)
          .limit(1)
          .get();
          
        if (usersSnapshot.empty) {
          alert('Recipient not found');
          return;
        }
        
        const recipient = usersSnapshot.docs[0];
        if (recipient.id === user.uid) {
          alert('You cannot send to yourself');
          return;
        }
        
        // Check sender balance
        const senderDoc = await db.collection('users').doc(user.uid).get();
        const senderBalance = senderDoc.data().cobrazBalance;
        
        if (senderBalance < amount) {
          alert('Insufficient balance');
          return;
        }
        
        // Perform transaction
        const batch = db.batch();
        
        // Update sender balance
        batch.update(db.collection('users').doc(user.uid), {
          cobrazBalance: firebase.firestore.FieldValue.increment(-amount)
        });
        
        // Update recipient balance
        batch.update(db.collection('users').doc(recipient.id), {
          cobrazBalance: firebase.firestore.FieldValue.increment(amount)
        });
        
        // Create transaction record
        const transactionRef = db.collection('transactions').doc();
        batch.set(transactionRef, {
          senderId: user.uid,
          receiverId: recipient.id,
          amount: amount,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'completed'
        });
        
        // Commit batch
        batch.commit()
          .then(() => {
            alert(`Successfully sent ${amount} ₡ to ${recipient.data().username}`);
            document.getElementById('sendAmount').value = '';
            document.getElementById('recipientAddress').value = '';
          })
          .catch(error => {
            alert('Transaction failed: ' + error.message);
          });
      });
    }
    
    // Receive page
    if (document.getElementById('cobrazAddress')) {
      db.collection('users').doc(user.uid).onSnapshot(doc => {
        if (doc.exists) {
          const userData = doc.data();
          document.getElementById('cobrazAddress').textContent = userData.cobrazAddress;
          document.getElementById('copyAddressBtn').setAttribute('data-address', userData.cobrazAddress);
          
          // Generate QR code
          if (document.getElementById('qrCode')) {
            new QRCode(document.getElementById('qrCode'), {
              text: userData.cobrazAddress,
              width: 200,
              height: 200,
              colorDark: "#00f3ff",
              colorLight: "transparent",
              correctLevel: QRCode.CorrectLevel.H
            });
          }
        }
      });
    }
  });
});