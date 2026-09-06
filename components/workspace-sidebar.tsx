'use client';

import { ArrowUpRight, ChevronRight, Moon, Settings2, Sparkles, Sun, X, type LucideIcon } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from '@/components/ui/sidebar';
import type { AppState } from '@/lib/model';

type NavigationItem = { id: string; label: string; icon: LucideIcon };
type Props = {
  navigation: NavigationItem[];
  view: string;
  navigate: (view: string) => void;
  profile: AppState['profile'];
  demo: boolean;
  toggleTheme: () => void;
};

const groups = [
  { label: 'Your daily space', ids: ['today', 'sat', 'engineering', 'skills', 'resources'] },
  { label: 'The next chapter', ids: ['github', 'market', 'university'] },
  { label: 'A little perspective', ids: ['journey', 'review'] },
];

export function WorkspaceSidebar({ navigation, view, navigate, profile, demo, toggleTheme }: Props) {
  const { setOpenMobile } = useSidebar();
  function open(section: string) {
    navigate(section);
    setOpenMobile(false);
  }

  return (
    <Sidebar className="app-sidebar fb-sidebar">
      <div className="fb-sidebar-frame">
        <SidebarHeader className="fb-sidebar-header">
          <a className="fb-brand" href="#today" aria-label="Future Builder — Your today" onClick={() => open('today')}>
            <span className="fb-monogram" aria-hidden="true">
              <span className="fb-monogram-type"><i>f</i><i>b</i></span>
              <span className="fb-monogram-spark"><Sparkles size={12} strokeWidth={1.6} /></span>
            </span>
            <span className="fb-wordmark"><span>future</span><em>builder.</em></span>
          </a>
          <button className="fb-mobile-close" aria-label="Close navigation" onClick={() => setOpenMobile(false)}><X size={18} /></button>
          <div className="fb-brand-rule" aria-hidden="true"><span /><span /><span /></div>
        </SidebarHeader>

        <SidebarContent className="fb-sidebar-content">
          <nav className="fb-navigation" aria-label="Workspace">
            {groups.map((group, groupIndex) => (
              <section className="fb-nav-group" key={group.label} aria-labelledby={`fb-nav-heading-${groupIndex}`}>
                <h2 id={`fb-nav-heading-${groupIndex}`} className="fb-nav-heading"><span>{group.label}</span><span aria-hidden="true">0{groupIndex + 1}</span></h2>
                {group.ids.map(id => {
                  const item = navigation.find(n => n.id === id);
                  if (!item) return null;
                  const Icon = item.icon;
                  const active = view === id;
                  return (
                    <button key={id} className="fb-nav-link" data-area={id} aria-current={active ? 'page' : undefined} onClick={() => open(id)}>
                      <span className="fb-nav-icon"><Icon size={18} strokeWidth={1.65} /></span>
                      <span className="fb-nav-label">{item.label}</span>
                      <span className="fb-nav-trailing" aria-hidden="true">{active ? <span className="fb-active-dot" /> : <ChevronRight size={13} />}</span>
                    </button>
                  );
                })}
              </section>
            ))}
          </nav>
          <div className="fb-sidebar-note">
            <span className="fb-note-mark" aria-hidden="true">“</span>
            <p>You’re allowed<br />to begin <em>again.</em></p>
            <span className="fb-note-line" aria-hidden="true" />
          </div>
        </SidebarContent>

        <SidebarFooter className="fb-sidebar-footer">
          <button className="fb-settings" aria-current={view === 'settings' ? 'page' : undefined} onClick={() => open('settings')}>
            <Settings2 size={17} strokeWidth={1.6} /><span>Make it yours</span><ArrowUpRight size={15} />
          </button>
          <div className="fb-account">
            <button className="fb-account-link" onClick={() => open('settings')} aria-label={`Personalize ${profile.name || 'your'} profile`}>
              <span className="fb-avatar">{profile.avatar || profile.name[0] || 'Y'}</span>
              <span className="fb-account-copy"><strong>{profile.name || 'Your personal space'}</strong><small><span aria-hidden="true" />{demo ? 'Example journey' : 'Your own pace'}</small></span>
            </button>
            <button className="fb-theme-toggle" onClick={toggleTheme} aria-label={profile.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} title={profile.theme === 'light' ? 'Dark theme' : 'Light theme'}>
              {profile.theme === 'light' ? <Sun size={17} strokeWidth={1.6} /> : <Moon size={17} strokeWidth={1.6} />}
            </button>
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
