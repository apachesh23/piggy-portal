import { Handle, Position } from 'reactflow';
import { memo } from 'react';
import { getAvatarColor, getRoleColor, getRoleLabel, getInitials, type UserRole } from '@/lib/constants/roles';

// ============================================================================
// ТИПЫ
// ============================================================================

type TeamCardNodeData = {
  id: number;
  username: string;
  avatar?: string | null;
  role: UserRole;
  maxWidth: number;
  onHover?: (userId: number | null) => void;
  onClick?: (userId: number) => void;
};

type LabelNodeData = {
  label: string;
};

// ============================================================================
// TEAM CARD NODE - Карточка пользователя
// ============================================================================

export const TeamCardNode = memo(function TeamCardNode({ data }: { data: TeamCardNodeData }) {
  return (
    <div style={{ width: data.maxWidth }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: 'transparent',
          border: 'none',
          width: 1,
          height: 1,
        }}
      />
      
      <div
        onMouseEnter={() => data.onHover?.(data.id)}
        onMouseLeave={() => data.onHover?.(null)}
        onClick={(e) => {
          e.stopPropagation();
          data.onClick?.(data.id);
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          transition: 'background-color 0.2s ease',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: data.avatar ? '#e9ecef' : getAvatarColor(data.role),
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            backgroundImage: data.avatar ? `url(${data.avatar})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!data.avatar && getInitials(data.username)}
        </div>

        {/* User Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'var(--color-foreground)'
            }}
          >
            {data.username}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: getRoleColor(data.role),
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontSize: '12px',
                color: getRoleColor(data.role),
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {getRoleLabel(data.role)}
            </div>
          </div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: 'transparent',
          border: 'none',
          width: 1,
          height: 1,
        }}
      />
    </div>
  );
});

// ============================================================================
// LABEL NODE - Метка (ADMINISTRATION, TEAMS)
// ============================================================================

export const LabelNode = memo(function LabelNode({ data }: { data: LabelNodeData }) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: 'transparent',
          border: 'none',
          width: 1,
          height: 1,
        }}
      />
      
      <div style={{ 
        padding: '12px 24px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '8px',
        border: '1px solid #ced4da',
      }}>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--color-foreground-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            
          }}
        >
          {data.label}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: 'transparent',
          border: 'none',
          width: 1,
          height: 1,
        }}
      />
    </>
  );
});