"use client";

import { useMemo, useState } from "react";
import { Users, UserCheck, UserX, Calendar, Building2, MapPin, Briefcase, ChevronDown, ChevronUp, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Participant {
  id: number;
  full_name: string;
  status: string;
  participant_role?: string;
  role?: string;
  oc?: string;
  position?: string;
  country?: string;
  contract_status?: string;
  gender_identity?: string;
  sex?: string;
}

interface ParticipantAnalyticsProps {
  participants: Participant[];
  onExpandedChange?: (expanded: boolean) => void;
}

export default function ParticipantAnalytics({ participants, onExpandedChange }: ParticipantAnalyticsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

  const stats = useMemo(() => {
    // Status breakdown
    const byStatus = participants.reduce((acc, p) => {
      const status = p.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Role breakdown
    const byRole = participants.reduce((acc, p) => {
      const role = (p.participant_role || p.role || 'visitor').toLowerCase();
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Gender breakdown
    const byGender = participants.reduce((acc, p) => {
      const gender = (p.gender_identity || p.sex || 'Not specified').toLowerCase();
      const key = gender.includes('male') && !gender.includes('female') ? 'male' :
                  gender.includes('female') ? 'female' :
                  gender.includes('other') || gender.includes('non-binary') ? 'other' :
                  'not specified';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // OC breakdown
    const byOC = participants.reduce((acc, p) => {
      const oc = p.oc || 'Not specified';
      acc[oc] = (acc[oc] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Country breakdown (top 5)
    const byCountry = participants.reduce((acc, p) => {
      const country = p.country || 'Not specified';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCountries = Object.entries(byCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Contract status breakdown
    const byContractStatus = participants.reduce((acc, p) => {
      const status = p.contract_status || 'Not specified';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Position breakdown (top 5)
    const byPosition = participants.reduce((acc, p) => {
      const position = p.position || 'Not specified';
      acc[position] = (acc[position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPositions = Object.entries(byPosition)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total: participants.length,
      byStatus,
      byRole,
      byGender,
      byOC,
      byCountry,
      topCountries,
      byContractStatus,
      topPositions,
    };
  }, [participants]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBg,
    change,
    changeType,
    gradient
  }: {
    title: string;
    value: number;
    icon: any;
    iconColor: string;
    iconBg: string;
    change?: string;
    changeType?: 'up' | 'down';
    gradient: string;
  }) => (
    <div className={`relative overflow-hidden rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 ${gradient}`}>
      <div className="absolute inset-0 bg-gradient-to-br opacity-10"></div>
      <div className="relative p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${iconBg} shadow-sm`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          {change && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shadow-sm ${
              changeType === 'up' ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'
            }`}>
              {changeType === 'up' ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {change}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );

  const BreakdownCard = ({
    title,
    data,
    icon: Icon,
    colorMap
  }: {
    title: string;
    data: Record<string, number>;
    icon: any;
    colorMap?: Record<string, string>;
  }) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);

    return (
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all">
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="p-1 rounded-md bg-gradient-to-br from-red-500 to-orange-500 shadow-sm">
            <Icon className="h-3 w-3 text-white" />
          </div>
          <h3 className="text-[10px] font-bold text-gray-900">{title}</h3>
        </div>

        <div className="space-y-1.5">
          {Object.entries(data).map(([key, value]) => {
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            const color = colorMap?.[key.toLowerCase()] || 'bg-gray-400';

            return (
              <div key={key} className="space-y-0.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-medium text-gray-600 capitalize">{key}</span>
                  <span className="text-gray-900 font-semibold">{value} ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full ${color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const statusColors: Record<string, string> = {
    'selected': 'bg-green-500',
    'confirmed': 'bg-blue-500',
    'attended': 'bg-purple-500',
    'waiting': 'bg-yellow-500',
    'declined': 'bg-red-500',
    'registered': 'bg-indigo-500',
  };

  const genderColors: Record<string, string> = {
    'male': 'bg-blue-500',
    'female': 'bg-pink-500',
    'other': 'bg-purple-500',
    'not specified': 'bg-gray-400',
  };

  const roleColors: Record<string, string> = {
    'visitor': 'bg-blue-500',
    'facilitator': 'bg-purple-500',
    'organizer': 'bg-orange-500',
  };

  const selectedPercentage = stats.total > 0 ? Math.round(((stats.byStatus['selected'] || 0) / stats.total) * 100) : 0;
  const declinedPercentage = stats.total > 0 ? Math.round(((stats.byStatus['declined'] || 0) / stats.total) * 100) : 0;

  return (
    <div className="mb-4">
      {/* Toggle Button */}
      <div className="mb-2">
        <Button
          onClick={handleToggle}
          variant="outline"
          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 hover:border-gray-300 hover:from-slate-100 hover:to-gray-100 transition-all rounded-lg shadow-sm hover:shadow"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
              <BarChart3 className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-semibold text-gray-900">Participant Analytics & Statistics</h3>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                {stats.total} total • {stats.byStatus['selected'] || 0} selected • {stats.byRole['facilitator'] || 0} facilitators
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium text-gray-500">
              {isExpanded ? 'Hide' : 'Show'}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
            )}
          </div>
        </Button>
      </div>

      {/* Analytics Content */}
      {isExpanded && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Total Participants"
              value={stats.total}
              icon={Users}
              iconColor="text-white"
              iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
              gradient="bg-gradient-to-br from-blue-50 to-blue-100"
            />
            <StatCard
              title="Selected"
              value={stats.byStatus['selected'] || 0}
              icon={UserCheck}
              iconColor="text-white"
              iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
              change={`${selectedPercentage}%`}
              changeType="up"
              gradient="bg-gradient-to-br from-emerald-50 to-emerald-100"
            />
            <StatCard
              title="Facilitators"
              value={stats.byRole['facilitator'] || 0}
              icon={Briefcase}
              iconColor="text-white"
              iconBg="bg-gradient-to-br from-purple-500 to-purple-600"
              gradient="bg-gradient-to-br from-purple-50 to-purple-100"
            />
            <StatCard
              title="Declined"
              value={stats.byStatus['declined'] || 0}
              icon={UserX}
              iconColor="text-white"
              iconBg="bg-gradient-to-br from-red-500 to-red-600"
              change={`${declinedPercentage}%`}
              changeType="down"
              gradient="bg-gradient-to-br from-red-50 to-red-100"
            />
          </div>

          {/* Detailed Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {/* Status Breakdown */}
        {Object.keys(stats.byStatus).length > 0 && (
          <BreakdownCard
            title="By Status"
            data={stats.byStatus}
            icon={Calendar}
            colorMap={statusColors}
          />
        )}

        {/* Gender Breakdown */}
        {Object.keys(stats.byGender).length > 0 && (
          <BreakdownCard
            title="By Gender"
            data={stats.byGender}
            icon={Users}
            colorMap={genderColors}
          />
        )}

        {/* Role Breakdown */}
        {Object.keys(stats.byRole).length > 0 && (
          <BreakdownCard
            title="By Role"
            data={stats.byRole}
            icon={Briefcase}
            colorMap={roleColors}
          />
        )}

        {/* OC Breakdown */}
        {Object.keys(stats.byOC).length > 1 && (
          <BreakdownCard
            title="By Operational Center"
            data={stats.byOC}
            icon={Building2}
          />
        )}

        {/* Top Countries */}
        {stats.topCountries.length > 0 && (
          <BreakdownCard
            title="Top Countries"
            data={Object.fromEntries(stats.topCountries)}
            icon={MapPin}
          />
        )}

        {/* Contract Status */}
        {Object.keys(stats.byContractStatus).length > 1 && (
          <BreakdownCard
            title="By Contract Status"
            data={stats.byContractStatus}
            icon={Briefcase}
          />
        )}
      </div>

          {/* Gender x OC Matrix (similar to the example image) */}
          {Object.keys(stats.byOC).length > 1 && Object.keys(stats.byGender).length > 0 && (
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all">
              <h3 className="text-[10px] font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-red-600" />
                Gender Distribution by Operational Center
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-1.5 px-2 font-semibold text-gray-700">OC</th>
                      {['Male', 'Female', 'Other', 'Not Specified'].map(gender => (
                        <th key={gender} className="text-center py-1.5 px-2 font-semibold text-gray-700">
                          {gender}
                        </th>
                      ))}
                      <th className="text-center py-1.5 px-2 font-semibold text-red-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                      {Object.keys(stats.byOC).map(oc => {
                        const ocParticipants = participants.filter(p => (p.oc || 'Not specified') === oc);
                        const ocByGender = ocParticipants.reduce((acc, p) => {
                          const gender = (p.gender_identity || p.sex || 'Not specified').toLowerCase();
                          const key = gender.includes('male') && !gender.includes('female') ? 'male' :
                                      gender.includes('female') ? 'female' :
                                      gender.includes('other') || gender.includes('non-binary') ? 'other' :
                                      'not specified';
                          acc[key] = (acc[key] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);

                        return (
                          <tr key={oc} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-1.5 px-2 font-medium text-gray-900">{oc}</td>
                            <td className="text-center py-1.5 px-2 text-blue-700 font-semibold">
                              {ocByGender['male'] || 0}
                            </td>
                            <td className="text-center py-1.5 px-2 text-pink-700 font-semibold">
                              {ocByGender['female'] || 0}
                            </td>
                            <td className="text-center py-1.5 px-2 text-purple-700 font-semibold">
                              {ocByGender['other'] || 0}
                            </td>
                            <td className="text-center py-1.5 px-2 text-gray-600 font-semibold">
                              {ocByGender['not specified'] || 0}
                            </td>
                            <td className="text-center py-1.5 px-2 text-red-700 font-bold">
                              {ocParticipants.length}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 font-bold border-t border-gray-300">
                        <td className="py-1.5 px-2 text-gray-900 text-[9px]">TOTAL</td>
                        <td className="text-center py-1.5 px-2 text-blue-700">
                          {stats.byGender['male'] || 0}
                        </td>
                        <td className="text-center py-1.5 px-2 text-pink-700">
                          {stats.byGender['female'] || 0}
                        </td>
                        <td className="text-center py-1.5 px-2 text-purple-700">
                          {stats.byGender['other'] || 0}
                        </td>
                        <td className="text-center py-1.5 px-2 text-gray-700">
                          {stats.byGender['not specified'] || 0}
                        </td>
                        <td className="text-center py-1.5 px-2 text-red-700 font-bold">
                          {stats.total}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
