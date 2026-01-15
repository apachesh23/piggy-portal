import { Title, Table } from '@mantine/core';

export default function LeaderboardPage() {
  return (
    <div>
      <Title order={1} mb="lg">Leaderboard</Title>
      
      <Table striped highlightOnHover withTableBorder>
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🥇 1</td>
            <td>John Doe</td>
            <td>9,999</td>
          </tr>
          <tr>
            <td>🥈 2</td>
            <td>Jane Smith</td>
            <td>8,888</td>
          </tr>
          <tr>
            <td>🥉 3</td>
            <td>Bob Johnson</td>
            <td>7,777</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}