import React, { useState } from 'react';
import { type Workflow, type CompanyResearchItem } from '../../types';
import './JobInsights.css';
import { getCookie } from '../../utils/csrf';

interface JobInsightsProps {
    jobId: number;
    workflows: Workflow[];
}

const CompanyResearchSection: React.FC<{ title: string; items: CompanyResearchItem[] }> = ({ title, items }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="insights-group">
            <div className="insights-subtitle">{title}</div>
            <ul className="insights-list">
                {items.map((item, i) => (
                    <li key={i} className="insights-list-item company-research-item">
                        <div className="research-value">{item.value}</div>
                        {item.example && (
                            <div className="research-example">
                                <span className="example-label">Example:</span> {item.example}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const JobInsights: React.FC<JobInsightsProps> = ({ jobId, workflows }) => {
    const [isResearching, setIsResearching] = useState(false);

    const extractRoleDetailsWorkflows = workflows.filter(
        w => w.workflow_name === 'extract_role_details'
    );

    const researchCompanyWorkflows = workflows.filter(
        w => w.workflow_name === 'research_company'
    );

    const hasRoleDetails = extractRoleDetailsWorkflows.length > 0;
    const hasCompanyResearch = researchCompanyWorkflows.length > 0;

    const handleResearchCompany = async () => {
        setIsResearching(true);
        const csrftoken = getCookie('csrftoken');
        try {
            await fetch('/job_application/research_company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken || '',
                },
                body: JSON.stringify({
                    job_application_ids: [jobId]
                })
            });
            // Note: The response handling and updating the workflow data 
            // would be handled by the parent component or a refresh mechanism
        } catch (error) {
            console.error('Failed to start company research:', error);
            setIsResearching(false);
        }
    };

    return (
        <div className="detail-item full-width">
            <div className="detail-label">Insights</div>
            <div className="insights-section">
                {/* Role Details Section */}
                {hasRoleDetails && extractRoleDetailsWorkflows.map((workflow, idx) => (
                    <React.Fragment key={`role-${idx}`}>
                        {workflow.responsibilities && workflow.responsibilities.length > 0 && (
                            <div className="insights-group">
                                <div className="insights-subtitle">Responsibilities</div>
                                <ul className="insights-list">
                                    {workflow.responsibilities.map((item, i) => (
                                        <li key={i} className="insights-list-item">{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {workflow.requirements && workflow.requirements.length > 0 && (
                            <div className="insights-group">
                                <div className="insights-subtitle">Requirements</div>
                                <ul className="insights-list">
                                    {workflow.requirements.map((item, i) => (
                                        <li key={i} className="insights-list-item">{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </React.Fragment>
                ))}

                {/* Company Research Section - Always show header */}
                <div className="company-research-section">
                    <div className="insights-section-header">Company Research</div>
                    {hasCompanyResearch ? (
                        researchCompanyWorkflows.map((workflow, idx) => (
                            <React.Fragment key={`company-${idx}`}>
                                <CompanyResearchSection
                                    title="Company Overview"
                                    items={workflow.company_research?.company_overview || []}
                                />
                                <CompanyResearchSection
                                    title="Business"
                                    items={workflow.company_research?.business || []}
                                />
                                <CompanyResearchSection
                                    title="Software Engineering"
                                    items={workflow.company_research?.software_engineering || []}
                                />
                            </React.Fragment>
                        ))
                    ) : (
                        <div className="research-action">
                            {isResearching ? (
                                <p className="research-in-progress-msg">
                                    🔍 Company research is in progress. This may take a few moments...
                                </p>
                            ) : (
                                <button
                                    className="research-company-btn"
                                    onClick={handleResearchCompany}
                                >
                                    Research Company
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Show no insights message only if no role details and no company research */}
                {!hasRoleDetails && !hasCompanyResearch && !isResearching && (
                    <p className="no-insights-msg" style={{ marginTop: 0 }}>No role insights available for this application.</p>
                )}
            </div>
        </div>
    );
};
