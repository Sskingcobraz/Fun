document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = '/index.html';
      return;
    }
    
    // Check if admin
    db.collection('users').doc(user.uid).get()
      .then(doc => {
        if (!doc.exists || !doc.data().isAdmin) {
          window.location.href = '/dashboard.html';
        } else {
          loadAdminData();
        }
      });
  });
  
  function loadAdminData() {
    // Load all users
    db.collection('users').get()
      .then(querySnapshot => {
        const usersTable = document.getElementById('usersTable');
        usersTable.innerHTML = '';
        
        querySnapshot.forEach(doc => {
          const user = doc.data();
          const row = document.createElement('tr');
          
          row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.cobrazAddress}</td>
            <td>${user.cobrazBalance} ₡</td>
            <td>
              <input type="number" id="adjust-${doc.id}" placeholder="Amount">
              <button class="adjust-btn" data-userid="${doc.id}">Adjust</button>
            </td>
          `;
          
          usersTable.appendChild(row);
        });
        
        // Add event listeners to adjust buttons
        document.querySelectorAll('.adjust-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const userId = e.target.getAttribute('data-userid');
            const amount = parseFloat(document.getElementById(`adjust-${userId}`).value);
            
            if (isNaN(amount)) {
              alert('Please enter a valid amount');
              return;
            }
            
            db.collection('users').doc(userId).update({
              cobrazBalance: firebase.firestore.FieldValue.increment(amount)
            })
            .then(() => {
              alert(`Successfully adjusted balance by ${amount} ₡`);
              document.getElementById(`adjust-${userId}`).value = '';
            })
            .catch(error => {
              alert('Error: ' + error.message);
            });
          });
        });
      });
    
    // Load all transactions
    db.collection('transactions')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get()
      .then(querySnapshot => {
        const transactionsTable = document.getElementById('transactionsTable');
        transactionsTable.innerHTML = '';
        
        querySnapshot.forEach(async doc => {
          const transaction = doc.data();
          
          // Get usernames
          const sender = await db.collection('users').doc(transaction.senderId).get();
          const receiver = await db.collection('users').doc(transaction.receiverId).get();
          
          const senderName = sender.exists ? sender.data().username : 'Unknown';
          const receiverName = receiver.exists ? receiver.data().username : 'Unknown';
          
          const row = document.createElement('tr');
          
          row.innerHTML = `
            <td>${senderName}</td>
            <td>${receiverName}</td>
            <td>${transaction.amount} ₡</td>
            <td>${transaction.timestamp.toDate().toLocaleString()}</td>
            <td>${transaction.status}</td>
          `;
          
          transactionsTable.appendChild(row);
        });
      });
    
    // Generate Cobraz form
    document.getElementById('generateForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById('generateAmount').value);
      const userId = document.getElementById('generateUserId').value;
      
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      
      db.collection('users').doc(userId).update({
        cobrazBalance: firebase.firestore.FieldValue.increment(amount)
      })
      .then(() => {
        alert(`Successfully generated ${amount} ₡ for user ${userId}`);
        document.getElementById('generateAmount').value = '';
      })
      .catch(error => {
        alert('Error: ' + error.message);
      });
    });
  }
});