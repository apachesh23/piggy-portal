'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  ReactFlowProvider,
  NodeTypes,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { UserRole } from '@/lib/constants/roles';
import { getRoleColor, getRoleLabel } from '@/lib/constants/roles';
import { TeamCardNode, LabelNode } from './TeamNodes';

// ============================================================================
// ТИПЫ
// ============================================================================

type User = {
  id: number;
  username: string;
  discord_avatar?: string | null;
  role: UserRole;
  permission_level: string;
  teamleader_id: number | null;
};

type TeamTreeProps = {
  users: User[];
  focusUserId?: number | null;
  onFocusComplete?: () => void;
};

// ============================================================================
// УТИЛИТЫ
// ============================================================================

const ROLE_ORDER: Record<UserRole, number> = {
  supervisor: 1,
  moderator: 2,
  super_bg: 3,
  junior: 4,
  teamleader: 5,
  admin: 6,
  tangiblee_partner: 7,
};

function sortUsersByRole(users: User[]): User[] {
  return [...users].sort((a, b) => {
    const orderA = ROLE_ORDER[a.role] ?? 999;
    const orderB = ROLE_ORDER[b.role] ?? 999;
    return orderA - orderB;
  });
}

function calculateMaxWidth(users: User[]): number {
  const maxLength = Math.max(...users.map(u => u.username.length));
  return Math.max(180, Math.min(250, maxLength * 8 + 80));
}

function findPathToTop(
  userId: number,
  users: User[],
  edges: Edge[]
): string[] {
  const pathEdges: string[] = [];
  const queue: string[] = [`user-${userId}`];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    
    if (visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);

    const incomingEdges = edges.filter(e => e.target === currentNodeId);

    for (const edge of incomingEdges) {
      if (!pathEdges.includes(edge.id)) {
        pathEdges.push(edge.id);
      }
      
      if (!visited.has(edge.source)) {
        queue.push(edge.source);
      }
    }
  }

  return pathEdges;
}

// ============================================================================
// NODE TYPES - Регистрация кастомных нод
// ============================================================================

const nodeTypes: NodeTypes = {
  teamCard: TeamCardNode,
  label: LabelNode,
};

// ============================================================================
// TEAM TREE CONTENT - Основной компонент
// ============================================================================

function TeamTreeContent({ users, focusUserId, onFocusComplete }: TeamTreeProps) {
  const router = useRouter();
  const reactFlowInstance = useReactFlow();
  const [hoveredUserId, setHoveredUserId] = useState<number | null>(null);
  
  const maxWidth = useMemo(() => calculateMaxWidth(users), [users]);
  const edgesRef = useRef<Edge[]>([]);

  // Обработчик клика - переход на профиль
  const handleUserClick = (userId: number) => {
    router.push(`/profile/${userId}`);
  };

  // Зум на найденного пользователя
  useEffect(() => {
    if (focusUserId && reactFlowInstance) {
      const node = reactFlowInstance.getNode(`user-${focusUserId}`);
      if (node) {
        reactFlowInstance.fitView({
          nodes: [node],
          duration: 800,
          padding: 0.5,
          maxZoom: 1.5,
        });
        
        // Вызываем callback после завершения анимации
        setTimeout(() => {
          onFocusComplete?.();
        }, 900);
      }
    }
  }, [focusUserId, reactFlowInstance, onFocusComplete]);

  // Создание нод
  const nodes = useMemo(() => {
    const nodes: Node[] = [];
    const ceoId = 7;

    const teamleaders = users.filter((u) => u.permission_level === 'teamleader');
    const admins = users.filter(
      (u) => (u.permission_level === 'admin' || u.permission_level === 'dev') && u.id !== ceoId
    );
    
    const tlSpacing = maxWidth + 20;
    const totalTLWidth = teamleaders.length > 0 ? (teamleaders.length - 1) * tlSpacing : 0;
    const centerX = totalTLWidth / 2;

    // ADMINISTRATION LABEL
    nodes.push({
      id: 'label-administration',
      type: 'label',
      data: { label: 'ADMINISTRATION' },
      position: { x: centerX - 102, y: -100 },
      draggable: false,
    });

    // CEO
    const ceo = users.find((u) => u.id === ceoId);
    if (ceo) {
      nodes.push({
        id: `user-${ceo.id}`,
        type: 'teamCard',
        data: {
          id: ceo.id,
          username: ceo.username,
          avatar: ceo.discord_avatar,
          role: ceo.role,
          maxWidth,
          onHover: setHoveredUserId,
          onClick: handleUserClick,
        },
        position: { x: centerX - maxWidth / 2, y: 0 },
        draggable: false,
      });
    }

    // ADMINS
    const adminSpacing = maxWidth + 20;
    const totalAdminWidth = admins.length > 0 ? (admins.length - 1) * adminSpacing : 0;
    const adminStartX = centerX - totalAdminWidth / 2 - maxWidth / 2;

    admins.forEach((admin, index) => {
      nodes.push({
        id: `user-${admin.id}`,
        type: 'teamCard',
        data: {
          id: admin.id,
          username: admin.username,
          avatar: admin.discord_avatar,
          role: admin.role,
          maxWidth,
          onHover: setHoveredUserId,
          onClick: handleUserClick,
        },
        position: { x: adminStartX + index * adminSpacing, y: 120 },
        draggable: false,
      });
    });

    // TEAMS LABEL
    nodes.push({
      id: 'label-teams',
      type: 'label',
      data: { label: 'TEAMS' },
      position: { x: centerX - 60, y: 240 },
      draggable: false,
    });

    // TEAMLEADERS + MEMBERS
    teamleaders.forEach((tl, tlIndex) => {
      const tlX = tlIndex * tlSpacing;
      
      // TeamLeader
      nodes.push({
        id: `user-${tl.id}`,
        type: 'teamCard',
        data: {
          id: tl.id,
          username: tl.username,
          avatar: tl.discord_avatar,
          role: tl.role,
          maxWidth,
          onHover: setHoveredUserId,
          onClick: handleUserClick,
        },
        position: { x: tlX, y: 360 },
        draggable: false,
      });

      // Team Members
      const teamMembers = users.filter(
        (u) =>
          u.teamleader_id === tl.id &&
          u.permission_level !== 'teamleader' &&
          u.permission_level !== 'admin' &&
          u.permission_level !== 'dev'
      );

      const sortedMembers = sortUsersByRole(teamMembers);

      sortedMembers.forEach((member, memberIndex) => {
        nodes.push({
          id: `user-${member.id}`,
          type: 'teamCard',
          data: {
            id: member.id,
            username: member.username,
            avatar: member.discord_avatar,
            role: member.role,
            maxWidth,
            onHover: setHoveredUserId,
            onClick: handleUserClick,
          },
          position: { x: tlX, y: 450 + memberIndex * 60 },
          draggable: false,
        });
      });
    });

    return nodes;
  }, [users, maxWidth]);

  // Создание edges (связей)
  const baseEdges = useMemo(() => {
    const edges: Edge[] = [];
    const ceoId = 7;

    const teamleaders = users.filter((u) => u.permission_level === 'teamleader');
    const admins = users.filter(
      (u) => (u.permission_level === 'admin' || u.permission_level === 'dev') && u.id !== ceoId
    );
    
    const ceo = users.find((u) => u.id === ceoId);

    // Admin label -> CEO
    if (ceo) {
      edges.push({
        id: 'admin-label-ceo',
        source: 'label-administration',
        target: `user-${ceo.id}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#bbb', strokeWidth: 2 },
      });
    }

    // CEO -> Admins
    admins.forEach((admin) => {
      if (ceo) {
        edges.push({
          id: `ceo-admin-${admin.id}`,
          source: `user-${ceo.id}`,
          target: `user-${admin.id}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#ccc', strokeWidth: 2, strokeDasharray: '5 5' },
        });
      }
    });

    // Admins -> Teams label
    admins.forEach((admin) => {
      edges.push({
        id: `admin-teams-${admin.id}`,
        source: `user-${admin.id}`,
        target: 'label-teams',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#ccc', strokeWidth: 2 },
      });
    });

    // Teams label -> TeamLeaders
    teamleaders.forEach((tl) => {
      edges.push({
        id: `teams-tl-${tl.id}`,
        source: 'label-teams',
        target: `user-${tl.id}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#ddd', strokeWidth: 2},
      });

      // TeamLeaders -> Members
      const teamMembers = users.filter(
        (u) =>
          u.teamleader_id === tl.id &&
          u.permission_level !== 'teamleader' &&
          u.permission_level !== 'admin' &&
          u.permission_level !== 'dev'
      );

      const sortedMembers = sortUsersByRole(teamMembers);

      sortedMembers.forEach((member) => {
        edges.push({
          id: `tl-member-${member.id}`,
          source: `user-${tl.id}`,
          target: `user-${member.id}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#e8e8e8', strokeWidth: 1 },
        });
      });
    });

    edgesRef.current = edges;
    return edges;
  }, [users]);

  // Подсветка путей при hover
  const edges = useMemo(() => {
    if (!hoveredUserId) return baseEdges;

    const highlightedEdgeIds = new Set(findPathToTop(hoveredUserId, users, baseEdges));
    
    return baseEdges.map(edge => {
      if (highlightedEdgeIds.has(edge.id)) {
        return {
          ...edge,
          style: { ...edge.style, stroke: '#3498db', strokeWidth: 3 },
          animated: true,
        };
      }
      return edge;
    });
  }, [hoveredUserId, baseEdges, users]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#fff',
    }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnScroll={false}
        panOnDrag={true}
        selectNodesOnDrag={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 50, zoom: 0.9 }}
        fitView
        fitViewOptions={{
          padding: 0.15,
        }}
      >
        <Background color="#ddd" gap={16} size={1} />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
    </div>
  );
}

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export function TeamTree({ users, focusUserId, onFocusComplete }: TeamTreeProps) {
  return (
    <ReactFlowProvider>
      <TeamTreeContent users={users} focusUserId={focusUserId} onFocusComplete={onFocusComplete} />
    </ReactFlowProvider>
  );
}