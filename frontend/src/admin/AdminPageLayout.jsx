import React from 'react';

const AdminPageLayout = ({
    title,
    actions,
    children,
    className = ''
}) => {
    return (
        <div className={`admin-page-layout ${className}`}>
            {/* Fixed Header */}
            <div className="admin-page-header">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h3 className="mb-0">{title}</h3>
                    </div>
                    <div className="d-flex gap-2">
                        {actions}
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="admin-page-content">
                {children}
            </div>
        </div>
    );
};

export default AdminPageLayout;