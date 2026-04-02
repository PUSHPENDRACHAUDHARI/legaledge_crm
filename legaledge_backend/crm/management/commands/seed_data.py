"Django management command to seed LegalEdge CRM demo data."
from django.core.management.base import BaseCommand
from accounts.models import CustomUser
from crm.models import Contact, Lead, Deal, Task, Company, Ticket, CallLog, Meeting, Activity


class Command(BaseCommand):
    help = 'Seed the database with LegalEdge CRM demo data'

    def handle(self, *args, **options):
        self.stdout.write('[*] Seeding LegalEdge CRM database...')

        # 1. Create demo users
        users = [
            dict(email='shailesh@legaledge.in', name='Shailesh Bhange', password='Admin@123',
                 role='admin', team_id=None),
            dict(email='arjun@legaledge.in', name='Arjun Mehta', password='Manager@123',
                 role='manager', team_id='team_01'),
            dict(email='priya@legaledge.in', name='Priya Sharma', password='User@123',
                 role='user', team_id='team_01'),
            dict(email='rohan@legaledge.in', name='Rohan Verma', password='User@123',
                 role='user', team_id='team_01'),
            dict(email='neha@legaledge.in', name='Neha Singh', password='User@123',
                 role='user', team_id='team_02'),
            dict(email='aman@legaledge.in', name='Aman Jha', password='User@123',
                 role='user', team_id='team_02'),
        ]

        created_users = {}
        for u in users:
            obj, created = CustomUser.objects.get_or_create(
                email=u['email'],
                defaults={
                    'name': u['name'],
                    'role': u['role'],
                    'team_id': u['team_id'],
                    'is_staff': u['role'] == 'admin',
                    'is_superuser': u['role'] == 'admin',
                }
            )
            if created:
                obj.set_password(u['password'])
                obj.save()
                self.stdout.write(f'  [+] Created user: {obj.email} ({obj.role})')
            else:
                self.stdout.write(f'  [-] User already exists: {obj.email}')
            created_users[u['email']] = obj

        admin_user = created_users.get('shailesh@legaledge.in')
        manager_user = created_users.get('arjun@legaledge.in')
        priya = created_users.get('priya@legaledge.in')
        rohan = created_users.get('rohan@legaledge.in')
        neha = created_users.get('neha@legaledge.in')
        aman = created_users.get('aman@legaledge.in')

        # 2. Contacts
        if not Contact.objects.exists():
            contacts_data = [
                dict(name='Rahul Sharma', email='rahul.sharma@techcorp.in', phone='+91-9876543210',
                     company='TechCorp India', role='CEO', city='Mumbai', status='active',
                     owner='Shailesh Bhange', industry='Technology', priority='High', type='Customer',
                     team_id='team_01', assigned_to=priya),
                dict(name='Priya Mehta', email='priya@legalsolutions.in', phone='+91-9871234560',
                     company='Legal Solutions Ltd', role='Partner', city='Delhi', status='active',
                     owner='Arjun Mehta', industry='Legal', priority='High', type='Lead',
                     team_id='team_01', assigned_to=priya),
                dict(name='Amit Joshi', email='amit.joshi@finpro.in', phone='+91-9823456781',
                     company='FinPro Services', role='CFO', city='Pune', status='active',
                     owner='Arjun Mehta', industry='Finance', priority='Medium', type='Customer',
                     team_id='team_01', assigned_to=rohan),
                dict(name='Sunita Verma', email='sunita@medicare.in', phone='+91-9756789012',
                     company='MediCare Group', role='Director', city='Hyderabad', status='inactive',
                     owner='Shailesh Bhange', industry='Healthcare', priority='Low', type='Prospect',
                     team_id=None, assigned_to=admin_user),
                dict(name='Karan Patel', email='karan.patel@retailco.in', phone='+91-9845671234',
                     company='RetailCo India', role='Manager', city='Ahmedabad', status='active',
                     owner='Arjun Mehta', industry='Retail', priority='Medium', type='Lead',
                     team_id='team_02', assigned_to=neha),
                dict(name='Meera Nair', email='meera@constructpro.in', phone='+91-9912345678',
                     company='ConstructPro', role='VP Sales', city='Bangalore', status='active',
                     owner='Arjun Mehta', industry='Construction', priority='High', type='Customer',
                     team_id='team_02', assigned_to=aman),
            ]
            Contact.objects.bulk_create([Contact(**c) for c in contacts_data])
            self.stdout.write(f'  [+] Created {len(contacts_data)} contacts')

        # 3. Leads
        if not Lead.objects.exists():
            leads_data = [
                dict(name='Vijay Khanna', email='vijay@startupx.in', phone='+91-9867890123',
                     company='StartupX', source='Website', status='New', owner='Shailesh Bhange',
                     value='2,50,000', temperature='Hot', industry='Technology',
                     notes='Interested in enterprise plan', team_id='team_01', assigned_to=priya),
                dict(name='Deepa Singh', email='deepa@lawfirm.in', phone='+91-9823456780',
                     company='Singh & Associates', source='Referral', status='Contacted',
                     owner='Arjun Mehta', value='1,80,000', temperature='Warm', industry='Legal',
                     notes='Follow-up scheduled', team_id='team_01', assigned_to=priya),
                dict(name='Rajesh Kumar', email='rajesh@mfgco.in', phone='+91-9756780123',
                     company='MfgCo Industries', source='LinkedIn', status='Qualified',
                     owner='Arjun Mehta', value='5,00,000', temperature='Hot', industry='Manufacturing',
                     notes='Budget approved', team_id='team_01', assigned_to=rohan),
                dict(name='Ananya Bose', email='ananya@edutech.in', phone='+91-9845670123',
                     company='EduTech Solutions', source='Email Campaign', status='New',
                     owner='Shailesh Bhange', value='75,000', temperature='Cold', industry='Education',
                     notes='Initial inquiry', team_id=None, assigned_to=admin_user),
                dict(name='Sachin Pawar', email='sachin@healthplus.in', phone='+91-9912340678',
                     company='HealthPlus', source='Event', status='Negotiation',
                     owner='Arjun Mehta', value='3,50,000', temperature='Warm', industry='Healthcare',
                     notes='Pricing discussion', team_id='team_02', assigned_to=neha),
                dict(name='Rahul S', email='rahul.s@team1.in', phone='9876543210',
                     company='TechCorp', source='Referral', status='New', owner='Priya Sharma',
                     value='1,00,000', temperature='Warm', industry='Technology',
                     notes='Via colleague referral', team_id='team_01', assigned_to=priya),
                dict(name='Priya Desai', email='priya.d@team1.in', phone='9123456780',
                     company='Desai Law', source='Website', status='Contacted', owner='Priya Sharma',
                     value='80,000', temperature='Warm', industry='Legal',
                     notes='Wants consultation', team_id='team_01', assigned_to=priya),
                dict(name='Vikram Nair', email='vikram@team1.in', phone='9988776655',
                     company='Nair Group', source='Ads', status='Qualified', owner='Rohan Verma',
                     value='2,20,000', temperature='Hot', industry='Finance',
                     notes='Demo scheduled', team_id='team_01', assigned_to=rohan),
                dict(name='Anita Kapoor', email='anita@team2.in', phone='9765432100',
                     company='Kapoor Inc', source='Referral', status='Won', owner='Neha Singh',
                     value='1,50,000', temperature='Hot', industry='Retail',
                     notes='Closed successfully', team_id='team_02', assigned_to=neha),
                dict(name='Suresh Pillai', email='suresh@team2.in', phone='9654321098',
                     company='Pillai Mfg', source='Cold Call', status='Lost', owner='Aman Jha',
                     value='50,000', temperature='Cold', industry='Manufacturing',
                     notes='Budget constraint', team_id='team_02', assigned_to=aman),
            ]
            Lead.objects.bulk_create([Lead(**l) for l in leads_data])
            self.stdout.write(f'  [+] Created {len(leads_data)} leads')

        # 4. Deals
        if not Deal.objects.exists():
            deals_data = [
                dict(name='Legal Suite Enterprise', company='TechCorp India', contact='Rahul Sharma',
                     value=500000, stage='Negotiation', owner='Shailesh Bhange',
                     close_date='2026-03-31', probability=75, team_id='team_01', assigned_to=priya),
                dict(name='CRM Starter Pack', company='Legal Solutions Ltd', contact='Priya Mehta',
                     value=150000, stage='Proposal', owner='Arjun Mehta',
                     close_date='2026-04-15', probability=50, team_id='team_01', assigned_to=priya),
                dict(name='Analytics Dashboard', company='FinPro Services', contact='Amit Joshi',
                     value=280000, stage='Contacted', owner='Arjun Mehta',
                     close_date='2026-04-30', probability=30, team_id='team_01', assigned_to=rohan),
                dict(name='Premium Support Plan', company='MediCare Group', contact='Sunita Verma',
                     value=120000, stage='Closed Won', owner='Shailesh Bhange',
                     close_date='2026-02-28', probability=100, team_id=None, assigned_to=admin_user),
                dict(name='Basic CRM License', company='RetailCo India', contact='Karan Patel',
                     value=60000, stage='New Lead', owner='Arjun Mehta',
                     close_date='2026-05-01', probability=20, team_id='team_02', assigned_to=neha),
                dict(name='Full Platform Bundle', company='ConstructPro', contact='Meera Nair',
                     value=750000, stage='Proposal', owner='Arjun Mehta',
                     close_date='2026-04-20', probability=60, team_id='team_02', assigned_to=aman),
                dict(name='Audit Module', company='Singh & Associates', contact='Deepa Singh',
                     value=90000, stage='Closed Lost', owner='Arjun Mehta',
                     close_date='2026-02-15', probability=0, team_id='team_01', assigned_to=priya),
            ]
            Deal.objects.bulk_create([Deal(**d) for d in deals_data])
            self.stdout.write(f'  [+] Created {len(deals_data)} deals')

        # 5. Tasks
        if not Task.objects.exists():
            tasks_data = [
                dict(title='Follow-up call with Priya Mehta', type='Call', priority='High',
                     due_date='2026-03-15', status='Pending', owner='Shailesh Bhange',
                     related='Lead: Priya Mehta', notes='Discuss enterprise pricing',
                     team_id='team_01', assigned_to=priya),
                dict(title='Send proposal to TechCorp', type='Email', priority='High',
                     due_date='2026-03-16', status='In Progress', owner='Arjun Mehta',
                     related='Deal: Legal Suite Enterprise', notes='Include case studies',
                     team_id='team_01', assigned_to=priya),
                dict(title='Schedule demo with FinPro', type='Meeting', priority='Medium',
                     due_date='2026-03-17', status='Pending', owner='Arjun Mehta',
                     related='Contact: Amit Joshi', notes='Analytics dashboard demo',
                     team_id='team_01', assigned_to=rohan),
                dict(title='Contract review - MediCare', type='Document', priority='Low',
                     due_date='2026-03-20', status='Completed', owner='Shailesh Bhange',
                     related='Deal: Premium Support Plan', notes='Final sign-off',
                     team_id=None, assigned_to=admin_user),
                dict(title='LinkedIn outreach - EduTech', type='Email', priority='Medium',
                     due_date='2026-03-18', status='Pending', owner='Arjun Mehta',
                     related='Lead: Ananya Bose', notes='Connect and share brochure',
                     team_id='team_02', assigned_to=neha),
                dict(title='Site visit - ConstructPro', type='Meeting', priority='High',
                     due_date='2026-03-19', status='Pending', owner='Arjun Mehta',
                     related='Deal: Full Platform Bundle', notes='Meet VP Sales team',
                     team_id='team_02', assigned_to=aman),
                dict(title='Follow-up call with Rahul', type='Call', priority='High',
                     due_date='2026-03-15', status='Pending', owner='Priya Sharma',
                     related='Lead: Rahul S', notes='',
                     team_id='team_01', assigned_to=priya),
                dict(title='Send retainer draft to Priya Desai', type='Document', priority='High',
                     due_date='2026-03-15', status='Pending', owner='Priya Sharma',
                     related='Lead: Priya Desai', notes='',
                     team_id='team_01', assigned_to=priya),
                dict(title='Update case notes - Anita', type='Document', priority='Medium',
                     due_date='2026-03-15', status='Completed', owner='Priya Sharma',
                     related='Lead: Anita Kapoor', notes='',
                     team_id='team_01', assigned_to=priya),
            ]
            Task.objects.bulk_create([Task(**t) for t in tasks_data])
            self.stdout.write(f'  [+] Created {len(tasks_data)} tasks')

        # 6. Companies
        if not Company.objects.exists():
            companies_data = [
                dict(name='TechCorp India', industry='Technology', size='500-1000', city='Mumbai',
                     website='techcorp.in', revenue='50 Cr', contacts=3, deals=2, status='Customer',
                     owner='Shailesh Bhange', team_id='team_01'),
                dict(name='Legal Solutions Ltd', industry='Legal', size='50-200', city='Delhi',
                     website='legalsolutions.in', revenue='15 Cr', contacts=2, deals=1, status='Prospect',
                     owner='Arjun Mehta', team_id='team_01'),
                dict(name='FinPro Services', industry='Finance', size='200-500', city='Pune',
                     website='finpro.in', revenue='30 Cr', contacts=1, deals=1, status='Customer',
                     owner='Arjun Mehta', team_id='team_01'),
                dict(name='MediCare Group', industry='Healthcare', size='1000+', city='Hyderabad',
                     website='medicare.in', revenue='200 Cr', contacts=2, deals=2, status='Customer',
                     owner='Shailesh Bhange', team_id=None),
                dict(name='RetailCo India', industry='Retail', size='100-500', city='Ahmedabad',
                     website='retailco.in', revenue='80 Cr', contacts=1, deals=1, status='Lead',
                     owner='Arjun Mehta', team_id='team_02'),
            ]
            Company.objects.bulk_create([Company(**c) for c in companies_data])
            self.stdout.write(f'  [+] Created {len(companies_data)} companies')

        # 7. Tickets
        if not Ticket.objects.exists():
            tickets_data = [
                dict(title='Cannot login to CRM', contact='Rahul Sharma', company='TechCorp India',
                     priority='High', status='Open', category='Technical', owner='Shailesh Bhange',
                     team_id='team_01'),
                dict(title='Invoice discrepancy', contact='Priya Mehta', company='Legal Solutions Ltd',
                     priority='Medium', status='In Progress', category='Billing', owner='Arjun Mehta',
                     team_id='team_01'),
                dict(title='Feature request - bulk import', contact='Amit Joshi', company='FinPro Services',
                     priority='Low', status='Open', category='Feature Request', owner='Arjun Mehta',
                     team_id='team_01'),
                dict(title='API integration help', contact='Meera Nair', company='ConstructPro',
                     priority='High', status='Closed', category='Technical', owner='Shailesh Bhange',
                     team_id='team_02'),
            ]
            Ticket.objects.bulk_create([Ticket(**t) for t in tickets_data])
            self.stdout.write(f'  [+] Created {len(tickets_data)} tickets')

        # 8. Call Logs
        if not CallLog.objects.exists():
            calls_data = [
                dict(contact='Rahul Sharma', phone='+91-9876543210', duration='8:32', status='Answered',
                     date='2026-03-10', time='10:15 AM', type='Outbound',
                     notes='Discussed enterprise pricing', team_id='team_01'),
                dict(contact='Priya Mehta', phone='+91-9871234560', duration='3:45', status='Missed',
                     date='2026-03-10', time='11:30 AM', type='Inbound', notes='', team_id='team_01'),
                dict(contact='Amit Joshi', phone='+91-9823456781', duration='12:08', status='Answered',
                     date='2026-03-09', time='02:00 PM', type='Outbound',
                     notes='Demo scheduled for next week', team_id='team_01'),
                dict(contact='Meera Nair', phone='+91-9912345678', duration='5:20', status='Answered',
                     date='2026-03-08', time='04:30 PM', type='Outbound',
                     notes='Contract review discussed', team_id='team_02'),
            ]
            CallLog.objects.bulk_create([CallLog(**c) for c in calls_data])
            self.stdout.write(f'  [+] Created {len(calls_data)} call logs')

        # 9. Meetings
        if not Meeting.objects.exists():
            meetings_data = [
                dict(title='Product Demo - TechCorp', type='Video Call', date='2026-03-12',
                     time='11:00 AM', contact='Rahul Sharma', duration='1 hour', platform='zoom',
                     notes='Full platform demo', team_id='team_01'),
                dict(title='Pricing Discussion - FinPro', type='Meeting', date='2026-03-14',
                     time='03:00 PM', contact='Amit Joshi', duration='45 min', platform='gmeet',
                     notes='Discuss enterprise pricing', team_id='team_01'),
                dict(title='Onboarding Kickoff - MediCare', type='Video Call', date='2026-03-18',
                     time='10:00 AM', contact='Sunita Verma', duration='1 hour', platform='teams',
                     notes='Welcome and setup', team_id=None),
            ]
            Meeting.objects.bulk_create([Meeting(**m) for m in meetings_data])
            self.stdout.write(f'  [+] Created {len(meetings_data)} meetings')

        # 10. Activities
        if not Activity.objects.exists():
            activities_data = [
                dict(entity='lead', entity_id=2, action='updated',
                     detail='Lead Deepa Singh moved to Contacted stage',
                     owner='Arjun Mehta', team_id='team_01', user=manager_user),
                dict(entity='deal', entity_id=1, action='updated',
                     detail='Deal Legal Suite Enterprise moved to Negotiation',
                     owner='Shailesh Bhange', team_id='team_01', user=admin_user),
                dict(entity='contact', entity_id=3, action='created',
                     detail='Contact Amit Joshi created from qualified lead',
                     owner='Arjun Mehta', team_id='team_01', user=manager_user),
                dict(entity='lead', entity_id=6, action='updated',
                     detail='You updated Rahul S -> Qualified',
                     owner='Priya Sharma', team_id='team_01', user=priya),
                dict(entity='lead', entity_id=7, action='created',
                     detail='You added lead Priya Desai',
                     owner='Priya Sharma', team_id='team_01', user=priya),
                dict(entity='task', entity_id=9, action='completed',
                     detail='You completed task Update case notes - Anita',
                     owner='Priya Sharma', team_id='team_01', user=priya),
            ]
            Activity.objects.bulk_create([Activity(**a) for a in activities_data])
            self.stdout.write(f'  [+] Created {len(activities_data)} activities')

        self.stdout.write(self.style.SUCCESS('\nDatabase seeded successfully!'))
        self.stdout.write('\nDemo credentials:')
        self.stdout.write('  Admin:   shailesh@legaledge.in / Admin@123')
        self.stdout.write('  Manager: arjun@legaledge.in   / Manager@123')
        self.stdout.write('  User:    priya@legaledge.in   / User@123')
