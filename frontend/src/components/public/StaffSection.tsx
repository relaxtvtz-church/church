import { Users } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import type { PublicStaff } from '../../types';

interface StaffSectionProps {
  staff: PublicStaff[];
}

export const StaffSection = ({ staff }: StaffSectionProps) => {
  // Ministry departments are review targets only — they are not people on the team card list.
  const team = staff.filter((member) => member.ministry !== 'Department');
  if (!team.length) return null;

  return (
    <section id="team" className="relative overflow-hidden border-t border-line bg-white py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 bg-[url('/brand/fellowship-art.svg')] bg-contain bg-no-repeat opacity-30"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand">
              <Users className="h-4 w-4" />
              Our team
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Meet the people serving you</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              These are the team members currently listed by the church administration. Their profiles update automatically whenever the admin portal changes.
            </p>
          </div>
          <span className="chip w-fit bg-brand-soft text-brand">{team.length} active team member{team.length === 1 ? '' : 's'}</span>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <article key={member.id} className="card hover-lift flex flex-col overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                <Avatar name={member.full_name} src={member.photo_url} size="xl" />
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-bold text-ink">{member.full_name}</h3>
                  {member.position && <p className="mt-1 text-[13px] font-semibold text-brand">{member.position}</p>}
                  {member.ministry && <span className="chip mt-2 bg-soft text-muted">{member.ministry}</span>}
                </div>
              </div>
              {member.bio && <p className="flex-1 border-t border-line p-5 text-[13px] leading-relaxed text-muted">{member.bio}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
