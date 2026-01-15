import { Handle, Position } from 'reactflow';
import { memo } from 'react';
import { getRoleColor, getRoleLabel, type UserRole } from '@/lib/constants/roles';

type TeamCardNodeData = {
  id: number;
  username: string;
  avatar?: string | null;
  role: UserRole;
  maxWidth: number;
  onHover?: (userId: number | null) => void;
  onClick?: (userId: number) => void;
};

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

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
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: data.avatar ? '#e9ecef' : getRoleColor(data.role),
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
              color: '#212529',
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