import { Handle, Position } from 'reactflow';
import { memo } from 'react';

type LabelNodeData = {
  label: string;
};

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
        border: '2px solid #ced4da',
      }}>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#868e96',
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