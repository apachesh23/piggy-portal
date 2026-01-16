import { Text } from '@mantine/core';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/statistics" style={{ textDecoration: 'none' }}>
      <Text size="xl" fw={700} c="var(--color-accent)">
        🐷 Piggy Portal
      </Text>
    </Link>
  );
}