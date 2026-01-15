'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  ReactFlowProvider,
  useOnViewportChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { UserRole } from '@/lib/constants/roles';
import { getRoleColor, getRoleLabel } from '@/lib/constants/roles';

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
};

const ROLE_ORDER: Record<UserRole, number> = {
  supervisor: 1,
  moderator: 2,
  super_bg: 3,
  junior: 4,
  teamleader: 5,
  admin: 6,
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

function TeamTreeContent({ users }: TeamTreeProps) {
  const [hoveredUserId, setHoveredUserId] = useState<number | null>(null);
  
  const maxWidth = useMemo(() => calculateMaxWidth(users), [users]);
  const edgesRef = useRef<Edge[]>([]);

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

    // Labels как дефолтные ноды
    nodes.push({
      id: 'label-administration',
      type: 'default',
      data: { label: 'ADMINISTRATION' },
      position: { x: centerX - 100, y: -100 },
      draggable: false,
      style: {
        background: 'rgba(255, 255, 255, 0.9)',
        border: '2px solid #ced4da',
        borderRadius: '8px',
        width: '200px',
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: 700,
        color: '#868e96',
      },
    });

    // CEO
    const ceo = users.find((u) => u.id === ceoId);
    if (ceo) {
      nodes.push({
        id: `user-${ceo.id}`,
        type: 'default',
        data: { 
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: getRoleColor(ceo.role),
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}>
                {ceo.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{ceo.username}</div>
                <div style={{ fontSize: 12, color: getRoleColor(ceo.role) }}>{getRoleLabel(ceo.role)}</div>
              </div>
            </div>
          )
        },
        position: { x: centerX - maxWidth / 2, y: 0 },
        draggable: false,
        style: {
          width: maxWidth,
          background: 'white',
          border: '1px solid #dee2e6',
          borderRadius: 6,
          padding: '8px 12px',
        },
      });
    }

    // Admins
    const adminSpacing = maxWidth + 20;
    const totalAdminWidth = admins.length > 0 ? (admins.length - 1) * adminSpacing : 0;
    const adminStartX = centerX - totalAdminWidth / 2 - maxWidth / 2;

    admins.forEach((admin, index) => {
      nodes.push({
        id: `user-${admin.id}`,
        type: 'default',
        data: { 
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: getRoleColor(admin.role),
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}>
                {admin.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{admin.username}</div>
                <div style={{ fontSize: 12, color: getRoleColor(admin.role) }}>{getRoleLabel(admin.role)}</div>
              </div>
            </div>
          )
        },
        position: { x: adminStartX + index * adminSpacing, y: 120 },
        draggable: false,
        style: {
          width: maxWidth,
          background: 'white',
          border: '1px solid #dee2e6',
          borderRadius: 6,
          padding: '8px 12px',
        },
      });
    });

    // Teams label
    nodes.push({
      id: 'label-teams',
      type: 'default',
      data: { label: 'TEAMS' },
      position: { x: centerX - 75, y: 240 },
      draggable: false,
      style: {
        background: 'rgba(255, 255, 255, 0.9)',
        border: '2px solid #ced4da',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: 700,
        color: '#868e96',
      },
    });

    // TeamLeaders + Members
    teamleaders.forEach((tl, tlIndex) => {
      const tlX = tlIndex * tlSpacing;
      
      nodes.push({
        id: `user-${tl.id}`,
        type: 'default',
        data: { 
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: getRoleColor(tl.role),
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}>
                {tl.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{tl.username}</div>
                <div style={{ fontSize: 12, color: getRoleColor(tl.role) }}>{getRoleLabel(tl.role)}</div>
              </div>
            </div>
          )
        },
        position: { x: tlX, y: 360 },
        draggable: false,
        style: {
          width: maxWidth,
          background: 'white',
          border: '1px solid #dee2e6',
          borderRadius: 6,
          padding: '8px 12px',
        },
      });

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
          type: 'default',
          data: { 
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: getRoleColor(member.role),
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                }}>
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{member.username}</div>
                  <div style={{ fontSize: 12, color: getRoleColor(member.role) }}>{getRoleLabel(member.role)}</div>
                </div>
              </div>
            )
          },
          position: { x: tlX, y: 450 + memberIndex * 60 },
          draggable: false,
          style: {
            width: maxWidth,
            background: 'white',
            border: '1px solid #dee2e6',
            borderRadius: 6,
            padding: '8px 12px',
          },
        });
      });
    });

    return nodes;
  }, [users, maxWidth]);

  const baseEdges = useMemo(() => {
    const edges: Edge[] = [];
    const ceoId = 7;

    const teamleaders = users.filter((u) => u.permission_level === 'teamleader');
    const admins = users.filter(
      (u) => (u.permission_level === 'admin' || u.permission_level === 'dev') && u.id !== ceoId
    );
    
    const ceo = users.find((u) => u.id === ceoId);

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

    teamleaders.forEach((tl) => {
      edges.push({
        id: `teams-tl-${tl.id}`,
        source: 'label-teams',
        target: `user-${tl.id}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#ddd', strokeWidth: 2 },
      });

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
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
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

export function TeamTree({ users }: TeamTreeProps) {
  return (
    <ReactFlowProvider>
      <TeamTreeContent users={users} />
    </ReactFlowProvider>
  );
}