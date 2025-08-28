import React from 'react';

interface DashboardSkeletonProps {
  isAdmin: boolean;
}

const SkeletonRow: React.FC<{ cells: number }> = ({ cells }) => (
  <tr className="animate-pulse">
    {Array.from({ length: cells }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className={`h-4 bg-slate-200 rounded ${i === 1 ? 'w-3/4' : 'w-1/2'}`}></div>
      </td>
    ))}
  </tr>
);

const MentorSkeleton = () => (
  <div>
    <div className="h-8 w-1/3 bg-slate-200 rounded mb-6 animate-pulse"></div>
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <ul className="divide-y divide-slate-200">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="p-4 sm:p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center w-full">
                <div className="mr-4 p-2 rounded-full bg-slate-200 h-12 w-12"></div>
                <div className="w-2/3 space-y-2">
                  <div className="h-5 w-1/2 bg-slate-200 rounded"></div>
                  <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
                </div>
              </div>
              <div className="h-10 w-32 bg-slate-200 rounded-md"></div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const AdminSkeleton = () => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <div className="h-8 w-1/4 bg-slate-200 rounded animate-pulse"></div>
            <div className="flex space-x-2 p-1 bg-slate-200 rounded-lg">
                <div className="h-10 w-32 bg-slate-300 rounded-md"></div>
                <div className="h-10 w-32 bg-slate-100 rounded-md"></div>
                <div className="h-10 w-32 bg-slate-100 rounded-md"></div>
            </div>
        </div>
         <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-3"><div className="h-4 w-12 bg-slate-200 rounded"></div></th>
                    <th className="px-6 py-3"><div className="h-4 w-24 bg-slate-200 rounded"></div></th>
                    <th className="px-6 py-3"><div className="h-4 w-32 bg-slate-200 rounded"></div></th>
                    <th className="px-6 py-3"><div className="h-4 w-24 bg-slate-200 rounded"></div></th>
                    <th className="px-6 py-3"><div className="h-4 w-40 bg-slate-200 rounded"></div></th>
                </tr>
                </thead>
                <tbody>
                    <SkeletonRow cells={5} />
                    <SkeletonRow cells={5} />
                    <SkeletonRow cells={5} />
                    <SkeletonRow cells={5} />
                </tbody>
            </table>
        </div>
    </div>
);


const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ isAdmin }) => {
  return isAdmin ? <AdminSkeleton /> : <MentorSkeleton />;
};

export default DashboardSkeleton;
