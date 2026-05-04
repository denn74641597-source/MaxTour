'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  Globe2,
  ImageIcon,
  Info,
  MapPin,
  MessageSquare,
  Phone,
  ShieldAlert,
  Sparkles,
  Tag,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAdminI18n } from '@/features/admin/i18n';
import type { AdminTourPanelItem } from '@/features/admin/types';
import { formatDate, formatNumber, formatPrice, placeholderImage } from '@/lib/utils';
import {
  buildTourQualityWarnings,
  collectTourImageUrls,
  resolveLocation,
  TourStatusKey,
} from './tour-admin-utils';
import { TourStatusBadge } from './tour-status-badge';

interface TourDetailSheetProps {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  tour: AdminTourPanelItem | null;
  onRequestStatusChange: (tour: AdminTourPanelItem, nextStatus: TourStatusKey) => void;
  statusBusy: boolean;
}

type TourDetailTab =
  | 'general'
  | 'media'
  | 'pricing'
  | 'agency'
  | 'moderation'
  | 'leads'
  | 'quality';

export function TourDetailSheet({
  open,
  onOpenChange,
  tour,
  onRequestStatusChange,
  statusBusy,
}: TourDetailSheetProps) {
  const { language, localizeStatus } = useAdminI18n();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TourDetailTab>('general');

  const imageUrls = useMemo(() => (tour ? collectTourImageUrls(tour) : []), [tour]);
  const warnings = useMemo(() => (tour ? buildTourQualityWarnings(tour) : []), [tour]);

  const notProvided = language === 'ru' ? 'Не указано' : 'Kiritilmagan';
  const notAvailable = language === 'ru' ? 'Недоступно' : 'Mavjud emas';
  const tabs = language === 'ru'
    ? {
        general: 'Общее',
        media: 'Медиа',
        pricing: 'Цена и сроки',
        agency: 'Агентство',
        moderation: 'Модерация',
        leads: 'Заявки',
        quality: 'Проверка качества',
      }
    : {
        general: 'Umumiy',
        media: 'Media',
        pricing: 'Narx va muddat',
        agency: 'Agentlik',
        moderation: 'Moderatsiya',
        leads: "So'rovlar",
        quality: 'Sifat tekshiruvi',
      };
  const warningLabels = language === 'ru'
    ? {
        'missing-image': 'Не добавлены изображения',
        'missing-price': 'Цена не заполнена или равна нулю',
        'missing-location': 'Локация заполнена не полностью',
        'missing-description': 'Отсутствует описание',
        'missing-agency': 'Тур не связан с агентством',
        'invalid-schedule': 'Дата возврата раньше даты выезда',
        'agency-unapproved': 'Агентство не подтверждено',
        'agency-unverified': 'Агентство не верифицировано',
        'missing-contact': 'Нет контактных данных',
      }
    : {
        'missing-image': "Rasmlar qo'shilmagan",
        'missing-price': "Narx to'ldirilmagan yoki nol",
        'missing-location': 'Joylashuv to\'liq kiritilmagan',
        'missing-description': "Tavsif mavjud emas",
        'missing-agency': "Tur agentlik bilan bog'lanmagan",
        'invalid-schedule': "Qaytish sanasi jo'nash sanasidan oldin",
        'agency-unapproved': 'Agentlik tasdiqlanmagan',
        'agency-unverified': 'Agentlik verifikatsiyadan o\'tmagan',
        'missing-contact': "Aloqa ma'lumoti yo'q",
      };

  const warningSeverity = (severity: 'low' | 'medium' | 'high') => {
    if (language === 'ru') {
      if (severity === 'high') return 'Высокий';
      if (severity === 'medium') return 'Средний';
      return 'Низкий';
    }
    if (severity === 'high') return 'Yuqori';
    if (severity === 'medium') return "O'rta";
    return 'Past';
  };

  if (!tour) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[96vw] max-w-4xl">
          <DialogHeader>
            <DialogTitle>{language === 'ru' ? 'Тур' : 'Tur'}</DialogTitle>
            <DialogDescription>
              {language === 'ru' ? 'Данные тура недоступны.' : "Tur ma'lumoti mavjud emas."}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const location = resolveLocation(tour);
  const leadCount = tour.leadSummary.count;
  const activePromotionCount = tour.activePromotions.length;
  const contactString = [tour.operator_phone, tour.operator_telegram_username]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(' | ');
  const publicLink = `https://mxtr.uz/tours/${tour.slug}`;
  const canCopyContact = contactString.trim().length > 0;

  const copyText = (value: string, label: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`${label}: ${language === 'ru' ? 'скопировано' : 'nusxalandi'}`))
      .catch(() => toast.error(language === 'ru' ? 'Не удалось скопировать' : "Nusxalab bo'lmadi"));
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen);
          if (!nextOpen) {
            setActiveTab('general');
          }
        }}
      >
        <DialogContent className="h-[88vh] w-[96vw] max-w-6xl overflow-hidden p-0">
          <div className="flex h-full flex-col bg-white">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-5 text-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <DialogTitle className="truncate text-xl font-semibold text-white">
                    {tour.title}
                  </DialogTitle>
                  <DialogDescription className="text-slate-300">
                    {language === 'ru'
                      ? 'Информация о туре, модерация и качество'
                      : 'Tur maʼlumoti, moderatsiya va sifat nazorati'}
                  </DialogDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <TourStatusBadge status={tour.status} />
                  {tour.is_featured ? (
                    <Badge className="bg-violet-500/20 text-violet-100">
                      {language === 'ru' ? 'Рекомендуемая' : 'Tavsiya'}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
                <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-1">
                  ID: {tour.id}
                </span>
                <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-1">
                  {location}
                </span>
                <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-1">
                  {formatPrice(tour.price ?? 0, tour.currency)}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TourDetailTab)} className="space-y-4">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 md:grid-cols-7">
                  <TabsTrigger value="general">{tabs.general}</TabsTrigger>
                  <TabsTrigger value="media">{tabs.media}</TabsTrigger>
                  <TabsTrigger value="pricing">{tabs.pricing}</TabsTrigger>
                  <TabsTrigger value="agency">{tabs.agency}</TabsTrigger>
                  <TabsTrigger value="moderation">{tabs.moderation}</TabsTrigger>
                  <TabsTrigger value="leads">{tabs.leads}</TabsTrigger>
                  <TabsTrigger value="quality">{tabs.quality}</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Stat label={language === 'ru' ? 'Цена' : 'Narx'} value={formatPrice(tour.price ?? 0, tour.currency)} icon={<Tag className="h-4 w-4" />} />
                    <Stat label={language === 'ru' ? 'Выезд' : 'Joʻnash'} value={tour.departure_date ? formatDate(tour.departure_date) : notProvided} icon={<Calendar className="h-4 w-4" />} />
                    <Stat
                      label={language === 'ru' ? 'Длительность' : 'Davomiylik'}
                      value={
                        tour.duration_days
                          ? language === 'ru'
                            ? `${tour.duration_days} дн. / ${tour.duration_nights ?? 0} ноч.`
                            : `${tour.duration_days} kun / ${tour.duration_nights ?? 0} tun`
                          : notProvided
                      }
                      icon={<Clock3 className="h-4 w-4" />}
                    />
                    <Stat
                      label={language === 'ru' ? 'Места' : "O'rinlar"}
                      value={
                        tour.seats_total != null || tour.seats_left != null
                          ? `${tour.seats_left ?? '-'} / ${tour.seats_total ?? '-'}`
                          : notProvided
                      }
                      icon={<Users className="h-4 w-4" />}
                    />
                    <Stat label={language === 'ru' ? 'Категория' : 'Kategoriya'} value={tour.category ?? notProvided} icon={<Sparkles className="h-4 w-4" />} />
                    <Stat label={language === 'ru' ? 'Локация' : 'Joylashuv'} value={location} icon={<MapPin className="h-4 w-4" />} />
                  </div>
                  <InfoBlock
                    title={language === 'ru' ? 'Описание' : 'Tavsif'}
                    icon={<Info className="h-4 w-4 text-slate-500" />}
                    value={tour.full_description || tour.short_description || notProvided}
                  />
                </TabsContent>

                <TabsContent value="media" className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-1">
                      <PreviewImage
                      src={
                        imageUrls[0] ??
                        placeholderImage(1200, 700, language === 'ru' ? 'Нет обложки' : "Muqova yo'q")
                      }
                        alt={tour.title}
                        onClick={() => setPreviewImage(imageUrls[0] ?? null)}
                        className="h-[240px] md:h-[300px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {imageUrls.slice(1, 5).map((url) => (
                        <PreviewImage
                          key={url}
                          src={url}
                          alt={tour.title}
                          onClick={() => setPreviewImage(url)}
                          className="h-[116px]"
                        />
                      ))}
                      {imageUrls.length <= 1 ? (
                        <div className="col-span-2 flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 text-xs text-slate-500">
                          {language === 'ru' ? 'Галерея не добавлена' : "Galereya qo'shilmagan"}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                  <InfoBlock
                    title={language === 'ru' ? 'Включено' : 'Kiritilgan xizmatlar'}
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    value={tour.included_services.length > 0 ? tour.included_services.join(', ') : notProvided}
                  />
                  <InfoBlock
                    title={language === 'ru' ? 'Не включено' : 'Kiritilmagan xizmatlar'}
                    icon={<XCircle className="h-4 w-4 text-rose-600" />}
                    value={tour.excluded_services.length > 0 ? tour.excluded_services.join(', ') : notProvided}
                  />
                  <InfoBlock
                    title={language === 'ru' ? 'Направления' : "Yo'nalishlar"}
                    icon={<Globe2 className="h-4 w-4 text-slate-500" />}
                    value={tour.destinations.length > 0 ? tour.destinations.join(', ') : notProvided}
                  />
                  <InfoBlock
                    title={language === 'ru' ? 'Дополнительно' : "Qo'shimcha ma'lumot"}
                    icon={<MessageSquare className="h-4 w-4 text-slate-500" />}
                    value={tour.additional_info || notProvided}
                  />
                </TabsContent>

                <TabsContent value="agency" className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{tour.agency?.name ?? (language === 'ru' ? 'Не связано' : "Bog'lanmagan")}</p>
                        <p className="text-xs text-slate-500">{tour.agency?.slug ? `/${tour.agency.slug}` : notProvided}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tour.agency?.is_verified ? (
                          <Badge className="bg-sky-100 text-sky-700">{language === 'ru' ? 'Верифицировано' : 'Tasdiqlangan'}</Badge>
                        ) : (
                          <Badge variant="outline">{language === 'ru' ? 'Не верифицировано' : 'Tasdiqlanmagan'}</Badge>
                        )}
                        {tour.agency?.is_approved ? (
                          <Badge className="bg-emerald-100 text-emerald-700">{language === 'ru' ? 'Подтверждено' : 'Tasdiqlangan'}</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">{language === 'ru' ? 'Без подтверждения' : 'Tasdiqlanmagan'}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {tour.agency?.phone || notProvided}
                      </p>
                      <p className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-slate-400" />
                        {tour.agency?.telegram_username || notProvided}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyText(publicLink, language === 'ru' ? 'Ссылка тура' : 'Tur havolasi')}>
                        <Copy className="h-3.5 w-3.5" />
                        {language === 'ru' ? 'Копировать ссылку' : 'Havolani nusxalash'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canCopyContact}
                        onClick={() => copyText(contactString, language === 'ru' ? 'Контакт' : 'Aloqa')}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {language === 'ru' ? 'Копировать контакт' : 'Aloqani nusxalash'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => (window.location.href = '/admin/agencies')}>
                        {language === 'ru' ? 'Открыть агентства' : 'Agentliklarni ochish'}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="moderation" className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Button disabled={statusBusy || tour.status === 'published'} onClick={() => onRequestStatusChange(tour, 'published')}>
                      {language === 'ru' ? 'Опубликовать' : 'Nashr etish'}
                    </Button>
                    <Button variant="outline" disabled={statusBusy || tour.status === 'pending'} onClick={() => onRequestStatusChange(tour, 'pending')}>
                      {language === 'ru' ? 'В ожидание' : 'Kutilmoqda'}
                    </Button>
                    <Button variant="outline" disabled={statusBusy || tour.status === 'draft'} onClick={() => onRequestStatusChange(tour, 'draft')}>
                      {language === 'ru' ? 'В черновик' : 'Qoralama'}
                    </Button>
                    <Button variant="destructive" disabled={statusBusy || tour.status === 'archived'} onClick={() => onRequestStatusChange(tour, 'archived')}>
                      {language === 'ru' ? 'В архив' : 'Arxivlash'}
                    </Button>
                  </div>
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
                    {language === 'ru'
                      ? 'Изменение приоритета рекламы недоступно в текущих серверных действиях.'
                      : "Reklama ustuvorligini o'zgartirish joriy server amallarida mavjud emas."}
                  </div>
                </TabsContent>

                <TabsContent value="leads" className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat label={language === 'ru' ? 'Просмотры' : "Ko'rishlar"} value={formatNumber(tour.view_count)} icon={<Eye className="h-4 w-4" />} />
                    <Stat label={language === 'ru' ? 'Заявки' : "So'rovlar"} value={formatNumber(leadCount)} icon={<Users className="h-4 w-4" />} />
                    <Stat label={language === 'ru' ? 'Последняя заявка' : "So'nggi so'rov"} value={tour.leadSummary.latestLeadAt ? formatDate(tour.leadSummary.latestLeadAt) : notAvailable} icon={<Clock3 className="h-4 w-4" />} />
                    <Stat label={language === 'ru' ? 'Активные рекламы' : 'Faol reklamalar'} value={formatNumber(activePromotionCount)} icon={<Sparkles className="h-4 w-4" />} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => (window.location.href = `/admin/leads?tourId=${tour.id}`)}>
                      {language === 'ru' ? 'Открыть заявки' : "So'rovlarni ochish"}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(publicLink, '_blank', 'noopener,noreferrer')}>
                      {language === 'ru' ? 'Открыть публичную страницу' : 'Ommaviy sahifani ochish'}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="quality" className="space-y-3">
                  {warnings.length === 0 ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                      {language === 'ru' ? 'Проблемы качества не обнаружены.' : 'Sifat bo\'yicha muammo topilmadi.'}
                    </div>
                  ) : (
                    warnings.map((warning) => (
                      <div
                        key={warning.key}
                        className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                      >
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-medium">{warningLabels[warning.key as keyof typeof warningLabels] ?? warning.label}</p>
                          <p className="text-xs uppercase tracking-wide text-amber-700">
                            {language === 'ru' ? 'Уровень' : 'Daraja'}: {warningSeverity(warning.severity)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(previewImage)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPreviewImage(null);
        }}
      >
        <DialogContent className="max-w-4xl bg-black p-2">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {language === 'ru' ? 'Предпросмотр изображения' : 'Rasm ko\'rinishi'}
            </DialogTitle>
          </DialogHeader>
          {previewImage ? (
            <div className="relative h-[70vh] overflow-hidden rounded-xl">
              <Image
                src={previewImage}
                alt={tour.title}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-1 flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="line-clamp-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoBlock({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
        {icon}
        {title}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{value}</p>
    </div>
  );
}

function PreviewImage({
  src,
  alt,
  className,
  onClick,
}: {
  src: string;
  alt: string;
  className: string;
  onClick: () => void;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-xl bg-slate-200 ${className}`}
    >
      {failed ? (
        <div className="flex h-full items-center justify-center text-slate-500">
          <ImageIcon className="h-6 w-6" />
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          onError={() => setFailed(true)}
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="50vw"
        />
      )}
    </button>
  );
}
