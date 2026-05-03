'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Copy,
  Mail,
  Phone,
  Shield,
  Star,
  TicketCheck,
  UserCircle2,
  Users2,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AdminUserPanelRow, AdminUserRole } from '@/features/admin/types';
import { cn, formatNumber } from '@/lib/utils';
import {
  accountStateLabel,
  accountStateTone,
  activityLabel,
  activityTone,
  formatDateTime,
  roleLabel,
  roleTone,
  safeImageUrl,
} from './users-admin-utils';

export type UserDetailTab = 'overview' | 'activity' | 'relations' | 'quality' | 'safety';

interface AdminUserDetailSheetProps {
  open: boolean;
  user: AdminUserPanelRow | null;
  activeTab: UserDetailTab;
  onTabChange: (tab: UserDetailTab) => void;
  onOpenChange: (open: boolean) => void;
  onCopy: (value: string | null | undefined, label: string) => Promise<void>;
  onRoleInfoOpen: (role: AdminUserRole) => void;
}

export function AdminUserDetailSheet({
  open,
  user,
  activeTab,
  onTabChange,
  onOpenChange,
  onCopy,
  onRoleInfoOpen,
}: AdminUserDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[98vw] border-slate-200 p-0 sm:max-w-[840px]">
        {user ? (
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <SheetTitle className="flex flex-wrap items-center gap-3 text-slate-900">
                <Avatar size="lg" className="h-11 w-11 border border-slate-200">
                  {safeImageUrl(user.avatar_url) ? (
                    <AvatarImage src={safeImageUrl(user.avatar_url)!} alt={user.full_name ?? 'User'} />
                  ) : null}
                  <AvatarFallback>
                    {(user.full_name ?? user.email ?? 'U').slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{user.full_name ?? 'Not provided'}</span>
              </SheetTitle>
              <SheetDescription className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium transition hover:brightness-95',
                      roleTone(user.role)
                    )}
                    onClick={() => onRoleInfoOpen(user.role)}
                  >
                    {roleLabel(user.role)}
                  </button>
                  <Badge variant="outline" className={cn(accountStateTone(user.accountState))}>
                    {accountStateLabel(user.accountState)}
                  </Badge>
                  <Badge variant="outline" className={cn(activityTone(user.stats.activityStatus))}>
                    {activityLabel(user.stats.activityStatus)}
                  </Badge>
                  <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                    Completeness: {user.quality.completenessPercent}%
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCopy(user.email, 'Email')}
                    disabled={!user.email}
                  >
                    <Mail />
                    Copy email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCopy(user.phone, 'Phone')}
                    disabled={!user.phone}
                  >
                    <Phone />
                    Copy phone
                  </Button>
                </div>
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as UserDetailTab)}>
                <TabsList className="grid grid-cols-5 rounded-xl bg-slate-100 p-1">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="relations">Relations</TabsTrigger>
                  <TabsTrigger value="quality">Quality</TabsTrigger>
                  <TabsTrigger value="safety">Safety</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 pt-4">
                  <Card className="rounded-2xl border border-slate-200 bg-white py-4">
                    <CardContent className="grid gap-3 px-4 sm:grid-cols-2">
                      <InfoRow icon={<UserCircle2 className="h-4 w-4" />} label="User ID" value={user.id} />
                      <InfoRow icon={<Shield className="h-4 w-4" />} label="Role" value={roleLabel(user.role)} />
                      <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email ?? 'Not provided'} />
                      <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone ?? 'Not provided'} />
                      <InfoRow icon={<Calendar className="h-4 w-4" />} label="Created" value={formatDateTime(user.created_at)} />
                      <InfoRow icon={<Calendar className="h-4 w-4" />} label="Updated" value={formatDateTime(user.updated_at)} />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200 bg-white py-4">
                    <CardContent className="space-y-2 px-4">
                      <p className="text-sm font-semibold text-slate-900">Role and permissions visibility</p>
                      <p className="text-sm text-slate-700">
                        Role updates are read-only in this panel because no existing safe admin role mutation flow is wired.
                      </p>
                      <p className="text-sm text-slate-700">
                        Admin access restriction remains bound to <code>profiles.role = 'admin'</code>.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MiniStat icon={<Star className="h-4 w-4" />} label="Favorites" value={user.stats.favoritesCount} />
                    <MiniStat icon={<Users2 className="h-4 w-4" />} label="Leads" value={user.stats.leadsCount} />
                    <MiniStat icon={<TicketCheck className="h-4 w-4" />} label="Reviews" value={user.stats.reviewsCount} />
                    <MiniStat icon={<Building2 className="h-4 w-4" />} label="Tours created" value={user.stats.toursCreatedCount} />
                  </div>

                  <Card className="rounded-2xl border border-slate-200 bg-white py-4">
                    <CardContent className="space-y-2 px-4">
                      <p className="text-sm font-semibold text-slate-900">Recent favorites</p>
                      {user.favoritesPreview.length === 0 ? (
                        <p className="text-sm text-slate-500">No favorites data available.</p>
                      ) : (
                        user.favoritesPreview.map((favorite) => (
                          <div key={favorite.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            <p className="font-medium text-slate-900">{favorite.tour?.title ?? 'Not available'}</p>
                            <p className="text-xs text-slate-500">{formatDateTime(favorite.created_at)}</p>
                            <p className="text-xs text-slate-500">{favorite.tour?.city ? `${favorite.tour.city}, ${favorite.tour.country}` : favorite.tour?.country ?? 'Location not available'}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200 bg-white py-4">
                    <CardContent className="space-y-2 px-4">
                      <p className="text-sm font-semibold text-slate-900">Recent leads / inquiries</p>
                      {user.leadsPreview.length === 0 ? (
                        <p className="text-sm text-slate-500">No user-linked leads found.</p>
                      ) : (
                        user.leadsPreview.map((lead) => (
                          <div key={lead.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-slate-900">{lead.tour?.title ?? 'Tour not linked'}</p>
                              <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                                {lead.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500">{lead.agency?.name ?? 'Agency not linked'}</p>
                            <p className="text-xs text-slate-500">{formatDateTime(lead.created_at)}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200 bg-white py-4">
                    <CardContent className="space-y-2 px-4">
                      <p className="text-sm font-semibold text-slate-900">Recent reviews</p>
                      {user.reviewsPreview.length === 0 ? (
                        <p className="text-sm text-slate-500">No reviews data available.</p>
                      ) : (
                        user.reviewsPreview.map((review) => (
                          <div key={review.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-slate-900">{review.agency?.name ?? 'Agency not linked'}</p>
                              <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                                Rating: {review.rating}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500">{review.comment ?? 'No comment'}</p>
                            <p className="text-xs text-slate-500">{formatDateTime(review.created_at)}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="relations" className="space-y-4 pt-4">
                  <Card className="rounded-2xl border border-slate-200 bg-white py-4">
                    <CardContent className="space-y-2 px-4">
                      <p className="text-sm font-semibold text-slate-900">Linked agencies</p>
                      {user.linkedAgencies.length === 0 ? (
                        <p className="text-sm text-slate-500">No linked agency.</p>
                      ) : (
                        user.linkedAgencies.map((agency) => (
                          <div key={agency.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{agency.name}</p>
                                <p className="text-xs text-slate-500">{agency.city ? `${agency.city}, ${agency.country}` : agency.country}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className={cn(agency.is_verified ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600')}>
                                  {agency.is_verified ? 'Verified' : 'Unverified'}
                                </Badge>
                                <Badge variant="outline" className={cn(agency.is_approved ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700')}>
                                  {agency.is_approved ? 'Approved' : 'Pending approval'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200 bg-white py-4">
                    <CardContent className="space-y-2 px-4">
                      <p className="text-sm font-semibold text-slate-900">Agency manager activity</p>
                      {user.managedToursPreview.length === 0 ? (
                        <p className="text-sm text-slate-500">No managed tours found for this user.</p>
                      ) : (
                        user.managedToursPreview.map((tour) => (
                          <div key={tour.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900">{tour.title}</p>
                              <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">{tour.status}</Badge>
                            </div>
                            <p className="text-xs text-slate-500">
                              {tour.city ? `${tour.city}, ${tour.country}` : tour.country ?? 'Location not available'}
                            </p>
                            <p className="text-xs text-slate-500">Views: {formatNumber(tour.view_count)}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="quality" className="space-y-4 pt-4">
                  <Card className="rounded-2xl border border-slate-200 bg-white py-4">
                    <CardContent className="space-y-3 px-4">
                      <p className="text-sm font-semibold text-slate-900">Profile quality score</p>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            user.quality.completenessPercent >= 80
                              ? 'bg-emerald-500'
                              : user.quality.completenessPercent >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                          )}
                          style={{ width: `${user.quality.completenessPercent}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-700">
                        Completeness: <span className="font-semibold text-slate-900">{user.quality.completenessPercent}%</span>
                      </p>
                      {user.quality.missingFields.length > 0 ? (
                        <div className="space-y-1">
                          {user.quality.missingFields.map((field) => (
                            <p key={field} className="text-sm text-amber-700">Missing {field}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-emerald-700">All core profile fields are present.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200 bg-white py-4">
                    <CardContent className="space-y-2 px-4">
                      <p className="text-sm font-semibold text-slate-900">Data quality warnings</p>
                      {user.quality.warnings.length === 0 ? (
                        <p className="text-sm text-emerald-700">No quality warnings detected.</p>
                      ) : (
                        user.quality.warnings.map((warning) => (
                          <p key={warning} className="flex items-center gap-1.5 text-sm text-amber-700">
                            <AlertTriangle className="h-4 w-4" />
                            {warning}
                          </p>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="safety" className="space-y-4 pt-4">
                  <Card className="rounded-2xl border border-slate-200 bg-white py-4">
                    <CardContent className="space-y-2 px-4">
                      <p className="text-sm font-semibold text-slate-900">Account state</p>
                      <p className="text-sm text-slate-700">Current state: {accountStateLabel(user.accountState)}</p>
                      <p className="text-sm text-slate-700">
                        Deletion requested at: {formatDateTime(user.deletion_requested_at)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200 bg-white py-4">
                    <CardContent className="space-y-2 px-4">
                      <p className="text-sm font-semibold text-slate-900">Moderation action center</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" render={<Link href="/admin/agencies" />}>
                          View linked agency
                        </Button>
                        <Button variant="outline" size="sm" render={<Link href="/admin/leads" />}>
                          View leads
                        </Button>
                        <Button variant="outline" size="sm" render={<Link href="/admin/tours" />}>
                          View tours
                        </Button>
                      </div>
                      <div className="grid gap-2 pt-2 sm:grid-cols-2">
                        <Button variant="outline" size="sm" disabled title="No safe block mutation flow exists in current admin layer.">
                          Block user (unsupported)
                        </Button>
                        <Button variant="outline" size="sm" disabled title="No safe restore mutation flow exists in current admin layer.">
                          Restore user (unsupported)
                        </Button>
                        <Button variant="outline" size="sm" disabled title="Role updates are intentionally read-only in this panel.">
                          Change role (read-only)
                        </Button>
                        <Button variant="outline" size="sm" disabled title="Bookings dataset is not available in current project query layer.">
                          View bookings (not available)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white py-3">
      <CardContent className="px-4">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
          {icon}
          {label}
        </p>
        <p className="mt-2 text-xl font-semibold text-slate-900">{formatNumber(value)}</p>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
