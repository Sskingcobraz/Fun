document.addEventListener('DOMContentLoaded', () => {
  // Load user data
  auth.onAuthStateChanged(user => {
    if (user) {
      loadUserData(user.uid);
      loadTransactions(user.uid);
    }
  });

  // Copy address button
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-btn')) {
      const address = e.target.getAttribute('data-address');
      navigator.clipboard.writeText(address).then(() => {
        e.target.textContent = 'Copied!';
        setTimeout(() => {
          e.target.textContent = 'Copy';
        }, 2000);
      });
    }
  });

  // Load user data
  function loadUserData(userId) {
    db.collection('users').doc(userId).onSnapshot(doc => {
      if (doc.exists) {
        const userData = doc.data();
        
        // Update dashboard
        if (document.getElementById('balanceAmount')) {
          document.getElementById('balanceAmount').textContent = `${userData.cobrazBalance} ₡`;
          document.getElementById('cobrazAddress').textContent = userData.cobrazAddress;
          document.getElementById('copyAddressBtn').setAttribute('data-address', userData.cobrazAddress);
        }
        
        // Update profile page
        if (document.getElementById('profileUsername')) {
          document.getElementById('profileUsername').textContent = userData.username;
          document.getElementById('profileEmail').textContent = userData.email;
          document.getElementById('profileAddress').textContent = userData.cobrazAddress;
          document.getElementById('profileBalance').textContent = `${userData.cobrazBalance} ₡`;
          document.getElementById('profileJoinDate').textContent = new Date(userData.joinDate?.toDate()).toLocaleDateString();
        }
        
        // Check if admin
        if (userData.isAdmin && !window.location.pathname.includes('admin.html')) {
          const adminLink = document.createElement('a');
          adminLink.href = '/admin.html';
          adminLink.textContent = 'Admin';
          adminLink.style.marginLeft = '1rem';
          adminLink.style.color = 'var(--neon-purple)';
          document.querySelector('nav ul')?.appendChild(adminLink);
        }
      }
    });
  }

  // Load transactions
  function loadTransactions(userId) {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;
    
    transactionsList.innerHTML = '<p>Loading transactions...</p>';
    
    db.collection('transactions')
      .where('senderId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get()
      .then(senderQuery => {
        db.collection('transactions')
          .where('receiverId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(10)
          .get()
          .then(receiverQuery => {
            const allTransactions = [];
            
            senderQuery.forEach(doc => {
              allTransactions.push({...doc.data(), id: doc.id, type: 'outgoing'});
            });
            
            receiverQuery.forEach(doc => {
              allTransactions.push({...doc.data(), id: doc.id, type: 'incoming'});
            });
            
            // Sort by timestamp
            allTransactions.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
            
            // Display transactions
            if (allTransactions.length === 0) {
              transactionsList.innerHTML = '<p>No transactions yet</p>';
              return;
            }
            
            transactionsList.innerHTML = '';
            allTransactions.slice(0, 10).forEach(async transaction => {
              const transactionElement = document.createElement('div');
              transactionElement.className = 'transaction-item';
              
              let otherUserId, action;
              if (transaction.type === 'outgoing') {
                otherUserId = transaction.receiverId;
                action = 'Sent to';
              } else {
                otherUserId = transaction.senderId;
                action = 'Received from';
              }
              
              // Get other user's data
              const otherUser = await db.collection('users').doc(otherUserId).get();
              const otherUsername = otherUser.exists ? otherUser.data().username : 'Unknown';
              
              transactionElement.innerHTML = `
                <div>
                  <div>${action} <strong>${otherUsername}</strong></div>
                  <small>${transaction.timestamp.toDate().toLocaleString()}</small>
                </div>
                <div class="transaction-amount ${transaction.type === 'incoming' ? 'positive' : 'negative'}">
                  ${transaction.type === 'incoming' ? '+' : '-'}${transaction.amount} ₡
                </div>
              `;
              
              transactionsList.appendChild(transactionElement);
            });
          });
      });
  }
});