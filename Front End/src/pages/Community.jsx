import { DailyPreferences } from "../components/DailyPreferences.jsx";
import { useState } from "react";
import { ProfilePhoto } from "../components/ProfilePhoto.jsx";
import {
  ArrowLeft,
  Check,
  Users,
  Plus,
  Heart,
  MessageCircle,
  Send,
  Settings,
  Shield,
  LogOut,
  Trash2,
  Flag,
  VolumeX,
  Download,
  RotateCcw,
  BookOpen,
  Sun,
  Wifi,
  WifiOff,
  LockKeyhole,
  ChevronLeft,
  Leaf,
} from "lucide-react";
import { useApp, ar, navigate } from "../context.jsx";
import {
  Button,
  Heading,
  IconButton,
  Modal,
  Pill,
  Empty,
  SectionTitle,
} from "../components/UI.jsx";
import { initialState, tiers } from "../data/model.js";
import Ship from "../components/Ship.jsx";
export function Circles() {
  const { state, update, notify } = useApp();
  const [active, setActive] = useState(state.groups[0]?.id || "");
  const [dialog, setDialog] = useState(null);
  const [name, setName] = useState("");
  const [invite, setInvite] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("feed");
  const [reported, setReported] = useState(false);
  const group = state.groups.find((g) => g.id === active);
  const posts = state.posts.filter((p) => p.groupId === active);
  const create = (e) => {
    e.preventDefault();
    const id = crypto.randomUUID();
    update((s) => ({
      ...s,
      groups: [
        ...s.groups,
        {
          id,
          name: name.trim(),
          description: "حلقة أنشأتها في هذه النسخة التجريبية",
          chat: true,
        },
      ],
    }));
    setActive(id);
    setDialog(null);
    setName("");
    notify("أُنشئت حلقتك التجريبية على هذا الجهاز.");
  };
  return (
    <>
      <Heading
        eyebrow="حلقات القراءة"
        title="صحبةٌ تعينك، برفق."
        description="مساحة للمساندة، دون مقارنات. ما تشاركه يبقى اختيارك."
        action={
          <Button onClick={() => setDialog("create")}>
            <Plus size={18} />
            أنشئ حلقة
          </Button>
        }
      />
      <div className="circles-layout">
        <aside className="circle-list">
          <SectionTitle title="حلقاتي" />
          {state.groups.map((g) => (
            <button
              key={g.id}
              className={`circle-list-item ${active === g.id ? "active" : ""}`}
              onClick={() => {
                setActive(g.id);
                setReported(false);
              }}
            >
              <span className="group-avatar">
                <Users size={23} />
              </span>
              <span>
                <strong>{g.name}</strong>
                <small>حلقة خاصة · تجريبية</small>
              </span>
              <ChevronLeft size={16} />
            </button>
          ))}
          <button className="join-circle" onClick={() => setDialog("join")}>
            <Plus size={18} />
            انضم برمز دعوة
          </button>
          <div className="circle-privacy">
            <Shield size={24} />
            <h3>سجلّك يبقى لك.</h3>
            <p>
              تسجيل القراءة لا ينشر تحديثًا تلقائيًا. أنت تختار الحلقة وتفاصيل
              كل مشاركة.
            </p>
          </div>
        </aside>
        <section className="circle-content">
          {group ? (
            <>
              <div className="circle-cover">
                <div className="group-avatar large">
                  <Users size={31} />
                </div>
                <div>
                  <Pill>مساحة خاصة</Pill>
                  <h2>{group.name}</h2>
                  <p>{group.description}</p>
                </div>
                <IconButton
                  label="إعدادات الحلقة"
                  onClick={() => setDialog("group-settings")}
                >
                  <Settings size={21} />
                </IconButton>
              </div>
              <div
                className="journey-tabs"
                role="tablist"
                aria-label="أقسام الحلقة"
              >
                <button
                  role="tab"
                  aria-selected={tab === "feed"}
                  onClick={() => setTab("feed")}
                >
                  <Leaf size={17} />
                  مساحة المشاركة
                </button>
                <button
                  role="tab"
                  aria-selected={tab === "chat"}
                  onClick={() => setTab("chat")}
                >
                  <MessageCircle size={17} />
                  المحادثة
                </button>
              </div>
              {tab === "feed" ? (
                <>
                  <div className="sharing-reminder">
                    <Shield size={17} />
                    <span>
                      المشاركات هنا أمثلة محلية؛ لا يراها أشخاص حقيقيون.
                    </span>
                  </div>
                  {group.id === "demo-circle" && !reported && (
                    <article className="feed-post">
                      <div className="post-author">
                        <span className="avatar warm">م</span>
                        <span>
                          <strong>
                            مريم <small>· شخصية توضيحية</small>
                          </strong>
                          <small>رسالة ترحيب</small>
                        </span>
                        <IconButton
                          label="الإبلاغ عن المثال"
                          onClick={() => setDialog("report")}
                        >
                          <Flag size={16} />
                        </IconButton>
                      </div>
                      <p>
                        أهلًا بكل بداية، وبكل عودة. هذه المساحة لنتساند، كلٌّ
                        على قدر يومه.
                      </p>
                      <button
                        className={`reaction ${state.reactions.includes("welcome") ? "active" : ""}`}
                        aria-pressed={state.reactions.includes("welcome")}
                        onClick={() =>
                          update((s) => ({
                            ...s,
                            reactions: s.reactions.includes("welcome")
                              ? s.reactions.filter((x) => x !== "welcome")
                              : [...s.reactions, "welcome"],
                          }))
                        }
                      >
                        <Heart
                          size={17}
                          fill={
                            state.reactions.includes("welcome")
                              ? "currentColor"
                              : "none"
                          }
                        />
                        معك {state.reactions.includes("welcome") ? "· ١" : ""}
                      </button>
                    </article>
                  )}
                  {posts.map((p) => (
                    <article className="feed-post" key={p.id}>
                      <div className="post-author">
                        <span className="avatar">ر</span>
                        <span>
                          <strong>أنت</strong>
                          <small>
                            مشاركة اخترتها ·{" "}
                            {p.detail ? "مع تفاصيل الآيات" : "دون تفاصيل"}
                          </small>
                        </span>
                        <IconButton
                          label="حذف المشاركة"
                          onClick={() => {
                            const prior = state.posts;
                            update((s) => ({
                              ...s,
                              posts: s.posts.filter((x) => x.id !== p.id),
                            }));
                            notify(
                              "حُذفت المشاركة. سجلّ القراءة الخاص محفوظ.",
                              () => update({ posts: prior }),
                            );
                          }}
                        >
                          <Trash2 size={17} />
                        </IconButton>
                      </div>
                      <p>{p.text}</p>
                      <span className="caption">
                        مرتبطة بسجلّ القراءة · تُزال عند تصحيحه
                      </span>
                    </article>
                  ))}
                  <div className="card">
                    <Empty
                      icon={BookOpen}
                      title={
                        posts.length ? "خطوتك القادمة لك." : "شارك حين ترغب."
                      }
                      action={
                        <Button
                          variant="secondary"
                          onClick={() => navigate("today")}
                        >
                          اذهب إلى سجلّ اليوم
                          <ArrowLeft size={17} />
                        </Button>
                      }
                    >
                      بعد تسجيل القراءة، افتح زر المشاركة لمراجعة التحديث
                      واختيار ما يظهر فيه.
                    </Empty>
                  </div>
                </>
              ) : (
                <section className="chat-panel card">
                  {group.chat ? (
                    <>
                      <div className="chat-messages">
                        <p className="chat-notice">
                          محادثة محلية لاختبار الكتابة. لا يوجد إرسال أو أعضاء
                          متصلون.
                        </p>
                        {state.messages
                          .filter((m) => m.groupId === active)
                          .map((m) => (
                            <div className="chat-message" key={m.id}>
                              <p>{m.text}</p>
                              <span>أنت · محفوظ محليًا</span>
                              <IconButton
                                label="حذف الرسالة"
                                onClick={() =>
                                  update((s) => ({
                                    ...s,
                                    messages: s.messages.filter(
                                      (x) => x.id !== m.id,
                                    ),
                                  }))
                                }
                              >
                                <Trash2 size={14} />
                              </IconButton>
                            </div>
                          ))}
                      </div>
                      <form
                        className="chat-input"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (message.trim()) {
                            update((s) => ({
                              ...s,
                              messages: [
                                ...s.messages,
                                {
                                  id: crypto.randomUUID(),
                                  groupId: active,
                                  text: message.trim(),
                                },
                              ],
                            }));
                            setMessage("");
                          }
                        }}
                      >
                        <input
                          aria-label="رسالتك التجريبية"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          maxLength={1000}
                          placeholder="اكتب كلمة طيبة…"
                        />
                        <IconButton
                          label="إضافة الرسالة محليًا"
                          type="submit"
                          disabled={!message.trim()}
                        >
                          <Send size={19} />
                        </IconButton>
                      </form>
                    </>
                  ) : (
                    <Empty icon={VolumeX} title="المحادثة متوقّفة">
                      يمكنك تشغيلها من إعدادات الحلقة التجريبية.
                    </Empty>
                  )}
                </section>
              )}
            </>
          ) : (
            <section className="card">
              <Empty
                icon={Users}
                title="رفقة جديدة تبدأ هنا"
                action={
                  <Button onClick={() => setDialog("join")}>
                    انضم إلى حلقة
                  </Button>
                }
              >
                أنشئ حلقتك أو جرّب الانضمام برمز SAFINA.
              </Empty>
            </section>
          )}
        </section>
      </div>
      {dialog === "create" && (
        <Modal title="أنشئ حلقتك" onClose={() => setDialog(null)}>
          <form onSubmit={create}>
            <p>
              حلقة خاصة على هذا الجهاز. سيحتاج دعوة أشخاص حقيقيين إلى ربط
              الخدمة.
            </p>
            <label className="field">
              اسم الحلقة
              <input
                required
                minLength={2}
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: رفقة الصباح"
              />
            </label>
            <Button type="submit">
              <Plus size={18} />
              إنشاء الحلقة
            </Button>
          </form>
        </Modal>
      )}
      {dialog === "join" && (
        <Modal title="انضم إلى حلقة" onClose={() => setDialog(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (invite.trim().toUpperCase() !== "SAFINA") {
                notify("هذا الرمز غير معروف. استخدم SAFINA لاختبار الانضمام.");
                return;
              }
              if (!state.groups.some((g) => g.id === "demo-circle"))
                update((s) => ({
                  ...s,
                  groups: [...s.groups, initialState().groups[0]],
                }));
              setActive("demo-circle");
              setDialog(null);
              notify("انضممت إلى الحلقة التجريبية.");
            }}
          >
            <p>
              استخدم الرمز <bdi>SAFINA</bdi> لتجربة دعوة صالحة.
            </p>
            <label className="field">
              رمز الدعوة
              <input
                dir="ltr"
                required
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                placeholder="SAFINA"
              />
            </label>
            <Button type="submit">
              الانضمام
              <ArrowLeft size={17} />
            </Button>
          </form>
        </Modal>
      )}
      {dialog === "group-settings" && group && (
        <Modal title="إعدادات الحلقة" onClose={() => setDialog(null)}>
          <label className="toggle-row">
            <span>
              <strong>المحادثة</strong>
              <small>تشغيل الرسائل داخل النموذج</small>
            </span>
            <input
              type="checkbox"
              checked={group.chat}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  groups: s.groups.map((g) =>
                    g.id === active ? { ...g, chat: e.target.checked } : g,
                  ),
                }))
              }
            />
          </label>
          <label className="toggle-row">
            <span>
              <strong>تنبيهات هادئة</strong>
              <small>تفضيل تجريبي؛ لا توجد إشعارات فعلية</small>
            </span>
            <input
              type="checkbox"
              checked={!!group.muted}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  groups: s.groups.map((g) =>
                    g.id === active ? { ...g, muted: e.target.checked } : g,
                  ),
                }))
              }
            />
          </label>
          <div className="info-box">
            المشاركة مع مراجعة كل مرة. النشر التلقائي غير موصول حتى تتوفر موافقة
            محدّدة وخدمة آمنة.
          </div>
          <Button variant="danger-button" onClick={() => setDialog("leave")}>
            <LogOut size={17} />
            مغادرة الحلقة
          </Button>
        </Modal>
      )}
      {dialog === "leave" && (
        <Modal title="مغادرة الحلقة؟" onClose={() => setDialog(null)}>
          <p>
            ستُحذف مشاركاتك ورسائلك من هذه الحلقة التجريبية. تبقى قراءاتك الخاصة
            في سجلّك.
          </p>
          <div className="modal-actions">
            <Button
              variant="danger-button"
              onClick={() => {
                update((s) => ({
                  ...s,
                  groups: s.groups.filter((g) => g.id !== active),
                  posts: s.posts.filter((p) => p.groupId !== active),
                  messages: s.messages.filter((m) => m.groupId !== active),
                }));
                setActive(state.groups.find((g) => g.id !== active)?.id || "");
                setDialog(null);
                notify("غادرت الحلقة، واحتفظت بسجلّك الخاص.");
              }}
            >
              مغادرة وحذف مشاركاتي
            </Button>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              البقاء
            </Button>
          </div>
        </Modal>
      )}
      {dialog === "report" && (
        <Modal title="الإبلاغ عن مشاركة" onClose={() => setDialog(null)}>
          <p>هذا اختبار لطلب المراجعة. لا يوجد مشرف متصل في النسخة.</p>
          <label className="field">
            سبب الإبلاغ
            <select>
              <option>محتوى غير مناسب</option>
              <option>مشاركة معلومات خاصة</option>
              <option>مضايقة</option>
            </select>
          </label>
          <Button
            onClick={() => {
              setReported(true);
              setDialog(null);
              notify("أُخفي المثال محليًا. لم يُرسل بلاغ إلى مشرف.");
            }}
          >
            <Flag size={16} />
            إخفاء المثال
          </Button>
        </Modal>
      )}
    </>
  );
}
export function SettingsPage() {
  const { state, update, notify } = useApp();
  const [reset, setReset] = useState(false);
  const [goal, setGoal] = useState(String(state.istighfarGoal || 100));
  const [tier, setTier] = useState(state.tier);
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "safina-private-prototype.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("صُدّرت نسخة من بياناتك المحلية.");
  };
  return (
    <>
      <Heading
        eyebrow="مساحتك، باختيارك"
        title="الإعدادات"
        description="اجعل التجربة أقرب إلى يومك، وتحكّم فيما تحتفظ به."
      />
      <div className="settings-grid">
        <div>
          <section className="card settings-card">
            <SectionTitle title="عن رحلتك" />
            <ProfilePhoto />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                update({ istighfarGoal: Number(goal) });
                notify("حُفظ الهدف. الأيام المسجّلة تحتفظ بهدفها الأصلي.");
              }}
            >
              <DailyPreferences
                country={state.countryCode}
                goal={goal}
                onCountry={(countryCode) => update({ countryCode })}
                onGoal={setGoal}
                required
              />
              <Button variant="secondary" type="submit">
                حفظ الهدف
              </Button>
            </form>
            <label className="field">
              الاسم الذي يظهر لك
              <input
                value={state.name}
                maxLength={35}
                onChange={(e) => update({ name: e.target.value })}
              />
            </label>
            <label className="field">
              التزامك
              <select value={tier} onChange={(e) => setTier(e.target.value)}>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="caption">
              أسماء وصفية مؤقتة. تغييرات المسارات الأسبوعية والمختلطة تحتاج
              سياسة الخادم. الاختيار هنا تجربة محلية ولا يعيد كتابة سجلّك.
            </p>
            <Button
              variant="secondary"
              disabled={tier === state.tier}
              onClick={() => {
                update({ tier });
                notify(
                  ["B", "BI"].includes(tier)
                    ? "تغيّر مسار العرض التجريبي، وبقي سجلّك محفوظًا."
                    : "اخترت معاينة مسار جدوله ينتظر الاعتماد.",
                );
              }}
            >
              تطبيق في التجربة
              <Check size={17} />
            </Button>
          </section>
          <section className="card settings-card">
            <SectionTitle title="القراءة والراحة" />
            <label className="toggle-row">
              <span>
                <strong>تكبير نص الواجهة</strong>
                <small>المصحف له أدوات حجم مستقلة</small>
              </span>
              <input
                type="checkbox"
                checked={state.largeText}
                onChange={(e) => update({ largeText: e.target.checked })}
              />
            </label>
            <label className="toggle-row">
              <span>
                <strong>تقليل الحركة</strong>
                <small>تجربة أكثر سكونًا</small>
              </span>
              <input
                type="checkbox"
                checked={state.reducedMotion}
                onChange={(e) => update({ reducedMotion: e.target.checked })}
              />
            </label>
            <label className="toggle-row">
              <span>
                <strong>تذكير بالقراءة</strong>
                <small>حفظ التفضيل فقط · الإشعارات غير متصلة</small>
              </span>
              <input
                type="checkbox"
                checked={state.reminder}
                onChange={(e) => update({ reminder: e.target.checked })}
              />
            </label>
            {state.reminder && (
              <label className="field">
                وقت التذكير
                <input
                  type="time"
                  value={state.reminderTime}
                  onChange={(e) => update({ reminderTime: e.target.value })}
                />
              </label>
            )}
            <p className="caption">
              اللغة: العربية · ورد اليوم والمجتمع بتوقيت مكة المكرمة.
            </p>
          </section>
          <section className="card settings-card">
            <SectionTitle title="الخصوصية والبيانات" />
            <div className="privacy-statement">
              <Shield size={28} />
              <p>
                بياناتك محفوظة في هذا المتصفح فقط. تظهر قراءاتك المكتملة
                تلقائيًا في معاينة المجتمع المحلية، ولا تُرسل إلى أعضاء آخرين.
              </p>
            </div>
            <Button variant="secondary" onClick={exportData}>
              <Download size={17} />
              تصدير بياناتي
            </Button>
            <p className="caption">
              التصدير يحتوي قراءاتك وملاحظاتك؛ احتفظ به في مكان خاص. مسح بيانات
              المتصفح يمحو النسخة المحلية.
            </p>
          </section>
        </div>
        <aside>
          <section className="tester-card">
            <Pill tone="gold">نسخة المؤسّس</Pill>
            <h2>كل الأبواب مفتوحة.</h2>
            <p>
              جميع الدروس والصفحات وأدوات التجربة متاحة، دون اشتراك أو تسجيل
              دخول.
            </p>
            <label className="field">
              اختبر حالة مختلفة
              <select
                value={state.scenario}
                onChange={(e) => update({ scenario: e.target.value })}
              >
                <option value="normal">التجربة العادية</option>
                <option value="return">العودة بعد انقطاع</option>
                <option value="offline">دون اتصال · محاكاة</option>
                <option value="error">تعذّر الخدمة · محاكاة</option>
                <option value="policy">قاعدة تنتظر الاعتماد</option>
                <option value="free">يوم حرّ · محاكاة</option>
              </select>
            </label>
            <Button onClick={() => navigate("today")}>
              شاهد الحالة في اليوم
              <ArrowLeft size={17} />
            </Button>
            <button className="text-btn" onClick={() => navigate("welcome")}>
              جرّب شاشة الترحيب
              <ArrowLeft size={16} />
            </button>
            <button className="text-btn danger" onClick={() => setReset(true)}>
              <RotateCcw size={16} />
              إعادة التجربة من البداية
            </button>
          </section>
          <section className="card settings-card">
            <h3>ما المتصل الآن؟</h3>
            <ul className="connection-list">
              <li>
                <Check size={17} />
                القراءة والتسجيل والحفظ المحلي
              </li>
              <li>
                <Check size={17} />
                كل الدروس وأدوات الاختبار
              </li>
              <li>
                <WifiOff size={17} />
                الخادم والتزامن غير متصلين
              </li>
              <li>
                <WifiOff size={17} />
                محتوى المدرّب لم يُضف بعد
              </li>
              <li>
                <WifiOff size={17} />
                المشاركات والإشعارات محلية
              </li>
            </ul>
          </section>
          <section className="card settings-card">
            <h3>هل تحتاج إلى مساعدة؟</h3>
            <details>
              <summary>كيف أصحّح قراءة؟</summary>
              <p>
                افتح سجلّ اليوم، ثم زر التصحيح بجانب القراءة. يمكنك تعديل النطاق
                أو إلغاء السجلّ.
              </p>
            </details>
            <details>
              <summary>هل أُرسلت مشاركتي؟</summary>
              <p>لا. الحلقة والمشاركات موجودة محليًا لتجربة الواجهة فقط.</p>
            </details>
            <details>
              <summary>لماذا لا يزيد رصيد القراءة الجزئية؟</summary>
              <p>
                قاعدة الرصيد الجزئي غير معتمدة بعد. تبقى قراءتك محفوظة دون تخمين
                الرصيد.
              </p>
            </details>
          </section>
        </aside>
      </div>
      {reset && (
        <Modal
          title="إعادة ضبط النسخة التجريبية؟"
          onClose={() => setReset(false)}
        >
          <p>
            سيُحذف سجلّ التجربة وملاحظاتك وحلقاتك من هذا المتصفح. يمكنك تصديرها
            أولًا من إعدادات الخصوصية.
          </p>
          <div className="modal-actions">
            <Button
              variant="danger-button"
              onClick={() => {
                update(initialState());
                setTier("BI");
                setReset(false);
                notify("أُعيدت النسخة إلى بدايتها.");
                navigate("today");
              }}
            >
              احذف بيانات التجربة
            </Button>
            <Button variant="secondary" onClick={() => setReset(false)}>
              إلغاء
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Welcome() {
  const { state, update } = useApp();
  const [tier, setTier] = useState(state.tier || "B");
  const [country, setCountry] = useState(state.countryCode || ""),
    [goal, setGoal] = useState(String(state.istighfarGoal || 100));
  return (
    <form
      className="welcome card"
      onSubmit={(e) => {
        e.preventDefault();
        update({
          tier,
          countryCode: country,
          istighfarGoal: Number(goal),
          welcomed: true,
        });
        navigate("today");
      }}
    >
      <Ship />
      <span className="eyebrow">مرحبًا بك في سفينة النور</span>
      <h1>رحلتك تبدأ بخطوة.</h1>
      <p>
        اقرأ ما التزمت به، وسجّل ما قرأته فعلًا.
        <br />
        ومع الأيام، ترى خطواتك تبني سفينتك.
      </p>
      <fieldset className="welcome-tiers">
        <legend>اختر بداية تناسبك</legend>
        {tiers.map((t) => (
          <label key={t.id} className={tier === t.id ? "active" : ""}>
            <input
              type="radio"
              name="welcome-tier"
              value={t.id}
              checked={tier === t.id}
              onChange={() => setTier(t.id)}
            />
            <strong>{t.label}</strong>
            <small>{t.detail}</small>
          </label>
        ))}
      </fieldset>
      <DailyPreferences
        country={country}
        goal={goal}
        onCountry={setCountry}
        onGoal={setGoal}
        required
      />
      <p className="caption">يظهر بلدك بجوار اسمك في المجتمع.</p>
      <Button type="submit">
        ابدأ رحلتي
        <ArrowLeft size={18} />
      </Button>
      <span className="quiet-note centered">
        <LockKeyhole size={14} />
        كل ميزات النسخة مفتوحة للتجربة
      </span>
    </form>
  );
}
