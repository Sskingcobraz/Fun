document.addEventListener('DOMContentLoaded', () => {
  // Load leaderboard
  const leaderboardBody = document.getElementById('leaderboardBody');
  
  db.collection('users')
    .orderBy('cobrazBalance', 'desc')
    .limit(10)
    .get()
    .then(querySnapshot => {
      leaderboardBody.innerHTML = '';
      let rank = 1;
      
      querySnapshot.forEach(doc => {
        const user = doc.data();
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>${rank}</td>
          <td>${user.username}</td>
          <td>${user.cobrazAddress}</td>
          <td>${user.cobrazBalance} ₡</td>
        `;
        
        leaderboardBody.appendChild(row);
        rank++;
      });
    });
});