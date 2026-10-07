-- Way Brand Intelligence — canvas brands table (full seed)
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.

create table if not exists public.brands (
  id          text primary key,
  name        text not null,
  mark        text,
  logo        text,
  model_3d    text,
  color       text default '#E52B50',
  category    text default 'Mobility',
  status      text default 'Concept',
  tagline     text,
  description text,
  url         text,
  audience    text,
  personality text[] default '{}',
  keywords    text[] default '{}',
  sort        int  default 100,
  created_at  timestamptz default now()
);

alter table public.brands add column if not exists logo text;
alter table public.brands add column if not exists model_3d text;   -- raw URL to a .glb extruded logo
alter table public.brands add column if not exists sort int default 100;

alter table public.brands enable row level security;
drop policy if exists "brands readable" on public.brands;
create policy "brands readable" on public.brands for select using (true);

insert into public.brands (id, name, mark, logo, color, category, status, sort, tagline, description, url, audience, personality, keywords) values
('parking','Way Parking','P','fig/logos/l1.png','#2E3A59','Mobility','Live',1,
 'Airport, city and event parking, booked ahead.',
 'The founding vertical and still the largest by volume. Way Parking covers airport lots, cruise ports, city garages and event venues, with prepaid reservations, free cancellation and shuttle timing built into the listing.',
 'way.com/parking','Frequent flyers and commuters who decide in under two minutes and care about price, distance to terminal and whether the shuttle actually runs.',
 array['Reliable','Practical','Fast','Reassuring','Value-led'],
 array['Reliable','Practical','Reassuring','Efficient','Value-led','Punctual','Straightforward','Secure','Familiar','Calm']),

('wash','Way Car Wash','C','fig/logos/l2.png','#2F7A6E','Care','Live',2,
 'Unlimited washes at local sites.',
 'A subscription and single-visit marketplace for car washes, with membership tiers that roll across partner sites rather than locking a driver to one location.',
 'way.com/car-wash','Drivers who wash more than twice a month and want the maths to favour a subscription.',
 array['Fresh','Routine','Local','Generous','Clean'],
 array['Fresh','Clean','Generous','Routine','Local','Bright','Effortless','Consistent','Cheerful','Modern']),

('gas','Way Gas','G','fig/logos/l3.png','#C1553B','Fuel','Live',3,
 'Cash back on every gallon.',
 'Fuel discounts and cash back through a linked card, surfacing the cheapest nearby stations and applying partner rebates at the pump.',
 'way.com/gas','High-mileage drivers and gig workers for whom a few cents a gallon compounds fast.',
 array['Everyday','Thrifty','Immediate','Wide','Simple'],
 array['Everyday','Thrifty','Immediate','Simple','Wide','Rewarding','Honest','Practical','Accessible','Direct']),

('refi','Way Refinance','R','fig/logos/l4.png','#B98A2E','Finance','Live',4,
 'Lower your monthly car payment.',
 'Auto loan refinancing with soft-pull quotes from a lender panel, positioned as a two-minute check rather than a formal application.',
 'way.com/refinance','Owners two or three years into a loan taken at a worse rate than they could get today.',
 array['Trustworthy','Considered','Substantial','Calm','Expert'],
 array['Trustworthy','Considered','Substantial','Calm','Expert','Transparent','Reassuring','Prudent','Credible','Fair']),

('repair','Way Repair','M','fig/logos/l5.png','#5B3A6E','Care','Live',5,
 'Vetted shops, quoted up front.',
 'Repair and scheduled maintenance booking with fixed quotes from vetted independent shops and dealer alternatives.',
 'way.com/repair','Drivers out of warranty who distrust dealer pricing but need proof the shop is competent.',
 array['Honest','Skilled','Transparent','Steady','Local'],
 array['Honest','Skilled','Transparent','Steady','Local','Competent','Fair','Accountable','Plain-spoken','Dependable']),

('ev','Way EV Charging','E','fig/logos/l6.png','#2F7A6E','Mobility','Live',6,
 'Find, filter and pay at any plug.',
 'A charging network aggregator with live availability, connector filtering and one payment method across operators.',
 'way.com/ev-charging','EV owners on unfamiliar routes who need certainty that the plug is free and working.',
 array['Modern','Clear','Networked','Efficient','Forward'],
 array['Modern','Clear','Efficient','Forward','Networked','Precise','Innovative','Confident','Seamless','Optimistic']),

('roadside','Way Roadside','A',null,'#C1553B','Support','Beta',7,
 'Help dispatched in minutes.',
 'On-demand roadside assistance without an annual membership: tow, jump, lockout, fuel delivery and tyre change with live driver tracking.',
 'way.com/roadside','Anyone stopped at the side of a road right now, on a phone with poor signal and low patience.',
 array['Urgent','Dependable','Human','Direct','Present'],
 array['Urgent','Dependable','Human','Direct','Present','Calm','Decisive','Reassuring','Available','Capable']),

('insurance','Way Insurance','I',null,'#2E3A59','Finance','Live',8,
 'Compare, switch, keep the coverage.',
 'Auto insurance comparison across carriers, with a switch flow that keeps existing coverage levels rather than quoting the cheapest thin policy.',
 'way.com/insurance','Renewal-shocked policyholders who suspect they are overpaying but dread the paperwork.',
 array['Protective','Rigorous','Fair','Plain-spoken','Solid'],
 array['Protective','Rigorous','Fair','Plain-spoken','Solid','Trustworthy','Impartial','Thorough','Steady','Clear']),

('wayplus','Way+','W+',null,'#B98A2E','Membership','Live',9,
 'One membership across every vertical.',
 'The paid membership tier that discounts every other service, holds the wallet and carries the gold-tier badge system used across listings.',
 'way.com/plus','Multi-service users who already touch two or more verticals a month.',
 array['Premium','Rewarding','Cohesive','Exclusive','Warm'],
 array['Premium','Rewarding','Cohesive','Exclusive','Warm','Generous','Elevated','Loyal','Confident','Refined']),

('paymeter','Paymeter','PM',null,'#5B3A6E','Mobility','Pilot',10,
 'Street meters, paid from the car.',
 'Municipal street parking payment and extension, integrating with city meter systems so a session can be topped up without walking back.',
 'way.com/paymeter','Downtown drivers and city partners who want fewer citations and less enforcement friction.',
 array['Civic','Quick','Unfussy','Local','Discreet'],
 array['Civic','Quick','Unfussy','Local','Discreet','Orderly','Frictionless','Practical','Modern','Considerate'])

on conflict (id) do update set
  name = excluded.name, mark = excluded.mark, logo = excluded.logo, color = excluded.color,
  category = excluded.category, status = excluded.status, sort = excluded.sort,
  tagline = excluded.tagline, description = excluded.description, url = excluded.url,
  audience = excluded.audience, personality = excluded.personality, keywords = excluded.keywords;


-- ── Direct-brand toggle ─────────────────────────────────────────────────────
-- is_direct = true  → the brand sits in the inner red orbit, wired to the Way
--                     centre with a connecting line.
-- is_direct = false → the brand sits on an outer (grey) orbit, unconnected.
-- is_direct = null  → fall back to the app's name-based inference.
alter table public.brands add column if not exists is_direct boolean;

-- Existing Way verticals are direct by definition.
update public.brands set is_direct = true
 where id in ('parking','wash','gas','refi','repair','ev','roadside','insurance');

-- Marks added for the four previously logo-less circles.
update public.brands set logo = 'fig/logos/l7.png'  where id = 'roadside';
update public.brands set logo = 'fig/logos/l8.png'  where id = 'insurance';
update public.brands set logo = 'fig/logos/l9.png'  where id = 'wayplus';
update public.brands set logo = 'fig/logos/l10.png' where id = 'paymeter';

-- Nine additional canvas brands.
insert into public.brands (id, name, mark, logo, color, category, status, sort, is_direct, tagline, description, url, audience, personality, keywords) values
('b11','New Brand 01','01','fig/logos/l11.png','#2F7A6E','Travel','Concept',11,true,
 'Trip planning, end to end.',
 'A concept brand covering multi-leg trip planning with parking, charging and transfers stitched into a single itinerary.',
 null,'Travellers who book their own multi-stop trips and hate reconciling five confirmations.',
 array['Optimistic','Fluid','Modern','Guiding','Open'],
 array['Optimistic','Fluid','Modern','Guiding','Open','Light','Considered','Fresh','Clear','Confident']),

('b12','New Brand 02','02','fig/logos/l12.png','#2E3A59','Fleet','Concept',12,true,
 'Fleet duty in one dashboard.',
 'A concept fleet product tracking vehicle duty, service intervals and driver assignment for small commercial fleets.',
 null,'Operations managers running twenty to two hundred vehicles without a dedicated systems team.',
 array['Rugged','Precise','Systematic','Steady','Capable'],
 array['Rugged','Precise','Systematic','Steady','Capable','Efficient','Bold','Practical','Direct','Solid']),

('b13','New Brand 03','03','fig/logos/l13.png','#C1553B','Travel','Concept',13,true,
 'Airports, ground to gate.',
 'A concept brand connecting airport ground services — parking, lounges, transfers — under one booking flow.',
 null,'Frequent flyers who treat the airport as the hardest part of the journey.',
 array['Global','Connected','Efficient','Worldly','Assured'],
 array['Global','Connected','Efficient','Worldly','Assured','Wide','Seamless','Modern','Punctual','Clear']),

('b14','New Brand 04','04','fig/logos/l14.png','#2E3A59','Finance','Concept',14,false,
 'Cover, layered by risk.',
 'An external comparison brand in the vehicle protection space, positioned on tiered coverage rather than price alone.',
 null,'Owners of newer vehicles weighing extended protection against dealer plans.',
 array['Protective','Layered','Rigorous','Solid','Formal'],
 array['Protective','Layered','Rigorous','Solid','Formal','Secure','Serious','Structured','Trustworthy','Precise']),

('b15','New Brand 05','05','fig/logos/l15.png','#C1553B','Travel','Concept',15,false,
 'Routes worth the detour.',
 'An external travel-discovery brand built around scenic routes, stops and overnight points.',
 null,'Road-trippers planning weekend routes rather than commutes.',
 array['Adventurous','Grounded','Warm','Local','Curious'],
 array['Adventurous','Grounded','Warm','Local','Curious','Bold','Earthy','Free','Vivid','Personal']),

('b16','New Brand 06','06','fig/logos/l16.png','#2E3A59','Travel','Concept',16,false,
 'Flights, parked and paid.',
 'An external air-travel booking brand that bundles airport parking at checkout.',
 null,'Leisure flyers who book flights and parking in the same sitting.',
 array['Direct','Bright','Efficient','Familiar','Simple'],
 array['Direct','Bright','Efficient','Familiar','Simple','Fast','Clear','Practical','Friendly','Modern']),

('b17','New Brand 07','07','fig/logos/l17.png','#5B3A6E','Logistics','Concept',17,false,
 'Same-day, city-wide.',
 'An external courier brand covering same-day city delivery, adjacent to Way through partner fulfilment.',
 null,'Small retailers promising same-day delivery without their own drivers.',
 array['Quick','Light','Precise','Discreet','Urban'],
 array['Quick','Light','Precise','Discreet','Urban','Nimble','Minimal','Reliable','Sharp','Quiet']),

('b18','New Brand 08','08','fig/logos/l18.png','#2F7A6E','Travel','Concept',18,false,
 'Coastal stays and slow miles.',
 'An external stays brand focused on coastal and rural overnight stops.',
 null,'Travellers extending a drive into a two-night trip.',
 array['Calm','Natural','Free','Gentle','Wide'],
 array['Calm','Natural','Free','Gentle','Wide','Airy','Soft','Restful','Open','Quiet']),

('b19','New Brand 09','09','fig/logos/l19.png','#5B3A6E','Finance','Concept',19,false,
 'Fleet payments, one ledger.',
 'An external payments brand handling fuel, tolls and parking on a single commercial ledger.',
 null,'Finance teams reconciling driver spend across several providers.',
 array['Formal','Exact','Monolithic','Serious','Structured'],
 array['Formal','Exact','Monolithic','Serious','Structured','Bold','Plain-spoken','Rigorous','Steady','Clear'])

on conflict (id) do update set
  name = excluded.name, mark = excluded.mark, logo = excluded.logo, color = excluded.color,
  category = excluded.category, status = excluded.status, sort = excluded.sort,
  is_direct = excluded.is_direct, tagline = excluded.tagline, description = excluded.description,
  url = excluded.url, audience = excluded.audience, personality = excluded.personality,
  keywords = excluded.keywords;
