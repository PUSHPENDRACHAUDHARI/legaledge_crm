// ─────────────────────────────────────────────────────────────────────────────
//  LegalEdge CRM  ·  Central Data Store
// ─────────────────────────────────────────────────────────────────────────────
export const OWNERS = ['Nainika Pounikar','Gaurav Dotonde','Bali Dondkar','Nikhil Lade','Styajit Galande','Subodh Badole'];
export const INDUSTRIES = ['Technology','Legal','Finance','Healthcare','Retail','Manufacturing','Education','Construction','Other'];

export function todayStr() { return new Date().toISOString().split('T')[0]; }
export function fmtINR(n)  { return '₹' + Number(n).toLocaleString('en-IN'); }
export function initials(name) { return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
export const AVATAR_COLORS = ['av-blue','av-green','av-purple','av-orange','av-red','av-teal'];

export const initialStore = {
  contacts: [],
  leads: [],
  deals: [],
  tasks: [],
  activities: [],
  notes: [],
  companies: [],
  tickets: [],
  callLogs: [],
  meetings: [],
  inbox: [
    {id:1,from:'Rahul Sharma',email:'rahul.sharma@techcorp.in',subject:'Re: LegalEdge Enterprise Proposal',   preview:'Thank you for sending over the proposal. The team has reviewed and we have a few questions about the pricing structure...',time:'10:32 AM',  unread:true, tag:'Deal'},
    {id:2,from:'Priya Mehta', email:'priya@legalsolutions.in',  subject:'Meeting follow-up',                  preview:'Following up on our meeting yesterday. I wanted to confirm the next steps we discussed regarding the CRM implementation...',time:'09:15 AM',  unread:true, tag:'Lead'},
    {id:3,from:'Amit Joshi',  email:'amit.joshi@finpro.in',     subject:'Analytics Dashboard Enquiry',        preview:'Hi, we are interested in the analytics module. Could you please share more details about the dashboard features?',              time:'Yesterday',unread:false,tag:'Prospect'},
    {id:4,from:'System',      email:'noreply@legaledge.in',     subject:'New Lead Alert: Sachin Pawar',       preview:'A new lead has been added to your pipeline. Sachin Pawar from HealthPlus has been assigned to you.',                         time:'Yesterday',unread:true, tag:'System'},
    {id:5,from:'Meera Nair',  email:'meera@constructpro.in',    subject:'Contract Status Update',             preview:'Just wanted to check in on the contract status. Our legal team has approved the terms and we are ready to proceed...',        time:'2 days ago',unread:false,tag:'Customer'},
  ],
  products:      [{id:1,name:'CRM Starter Pack',  sku:'CRM-001',price:4999, category:'Software',stock:'Unlimited',status:'Active',description:'Basic CRM for small teams'},{id:2,name:'CRM Professional',sku:'CRM-002',price:12999,category:'Software',stock:'Unlimited',status:'Active',description:'Advanced CRM with analytics'},{id:3,name:'Enterprise Bundle',  sku:'CRM-003',price:39999,category:'Software',stock:'Unlimited',status:'Active',description:'Full platform for enterprises'},{id:4,name:'Onboarding Service',sku:'SVC-001',price:9999, category:'Service', stock:'10',      status:'Active',description:'1-month onboarding assistance'},{id:5,name:'Data Migration',     sku:'SVC-002',price:14999,category:'Service', stock:'5',       status:'Active',description:'Migrate from existing CRM'}],
  quotes:        [{id:1,title:'Q-2026-001',contact:'Rahul Sharma',company:'TechCorp India',    amount:499900,status:'Sent',    created:'2026-03-01',expiry:'2026-03-31',owner:'Nainika Pounikar'},{id:2,title:'Q-2026-002',contact:'Priya Mehta',company:'Legal Solutions Ltd',amount:149900,status:'Draft',   created:'2026-03-03',expiry:'2026-04-03',owner:'Gaurav Dotonde'},{id:3,title:'Q-2026-003',contact:'Meera Nair',company:'ConstructPro',      amount:749900,status:'Accepted',created:'2026-02-20',expiry:'2026-03-20',owner:'Subodh Badole'}],
  invoices:      [{id:1,number:'INV-2026-001',contact:'Rahul Sharma',company:'TechCorp India',  amount:499900,status:'Paid',   due:'2026-03-15',issued:'2026-03-01'},{id:2,number:'INV-2026-002',contact:'Meera Nair', company:'ConstructPro',    amount:749900,status:'Pending',due:'2026-03-25',issued:'2026-03-05'},{id:3,number:'INV-2026-003',contact:'Amit Joshi', company:'FinPro Services',  amount:129900,status:'Overdue',due:'2026-02-28',issued:'2026-02-01'}],
  orders:        [{id:1,number:'ORD-001',customer:'TechCorp India',contact:'Rahul Sharma',product:'Enterprise Bundle',  amount:499900,status:'Fulfilled', date:'2026-03-01'},{id:2,number:'ORD-002',customer:'ConstructPro',  contact:'Meera Nair',  product:'CRM Professional',amount:149900,status:'Processing',date:'2026-03-05'},{id:3,number:'ORD-003',customer:'FinPro Services',contact:'Amit Joshi', product:'Onboarding Service',amount:99900, status:'Pending',   date:'2026-03-07'}],
  payments:      [{id:1,ref:'PAY-001',from:'TechCorp India',  amount:499900,method:'Bank Transfer',status:'Completed',date:'2026-03-03'},{id:2,ref:'PAY-002',from:'ConstructPro',  amount:249900,method:'UPI',         status:'Completed',date:'2026-03-06'},{id:3,ref:'PAY-003',from:'MediCare Group',amount:120000,method:'Cheque',      status:'Processing',date:'2026-03-08'}],
  subscriptions: [{id:1,customer:'TechCorp India',    plan:'Enterprise',  amount:39999,billing:'Monthly',status:'Active',renewal:'2026-04-01'},{id:2,customer:'Legal Solutions Ltd',plan:'Professional',amount:12999,billing:'Monthly',status:'Active',renewal:'2026-04-05'},{id:3,customer:'MediCare Group',    plan:'Enterprise',  amount:39999,billing:'Annual', status:'Active',renewal:'2027-01-01'}],
  playbooks: [
    {id:1,name:'Initial Discovery Call',    category:'Sales',  steps:['Introduce yourself & LegalEdge','Ask about current CRM pain points','Identify decision makers','Qualify budget & timeline','Schedule follow-up demo'],used:34},
    {id:2,name:'Product Demo Script',       category:'Sales',  steps:['Demo dashboard & KPIs','Show contact management','Walk through deal pipeline','Highlight automation features','Address objections','Propose next steps'],used:28},
    {id:3,name:'Objection Handling Guide',  category:'Sales',  steps:['Listen completely before responding','Acknowledge the concern','Ask clarifying questions','Present counter-evidence','Confirm resolution'],used:19},
    {id:4,name:'Onboarding Checklist',      category:'Success',steps:['Send welcome email','Schedule kickoff call','Data migration walkthrough','Team training session','30-day check-in'],used:12},
  ],
  templates: [
    {id:1,name:'Welcome Email',      subject:'Welcome to LegalEdge CRM!',                          preview:"Hi {{first_name}}, We're excited to have you on board...", tags:['Onboarding','Welcome'],used:45},
    {id:2,name:'Follow-up After Demo',subject:'Thank you for your time, {{first_name}}',           preview:'Hi {{first_name}}, It was great speaking with you today...',tags:['Sales','Follow-up'],  used:38},
    {id:3,name:'Proposal Email',     subject:'LegalEdge CRM Proposal for {{company}}',             preview:'Dear {{first_name}}, Please find attached the proposal...',tags:['Sales','Proposal'],   used:22},
    {id:4,name:'Invoice Reminder',   subject:'Invoice #{{invoice_number}} Due Soon',               preview:'Hi {{first_name}}, This is a gentle reminder...',          tags:['Billing','Reminder'], used:17},
    {id:5,name:'Support Response',   subject:'Re: {{ticket_subject}} – Ticket #{{ticket_id}}',    preview:'Hi {{first_name}}, Thank you for reaching out...',          tags:['Support','Service'],  used:29},
  ],
  snippets: [
    {id:1,shortcut:'#intro',  name:'Introduction',text:"Hi, I'm from LegalEdge CRM. We help businesses manage their customer relationships and sales pipeline with an intuitive, powerful platform."},
    {id:2,shortcut:'#pricing',name:'Pricing Info', text:'Our plans start at ₹4,999/month for Starter. Professional at ₹12,999/month and Enterprise at ₹39,999/month with full feature access.'},
    {id:3,shortcut:'#demo',   name:'Demo CTA',     text:'Would you like to schedule a personalized demo? I can walk you through how LegalEdge CRM can help specifically with your use case.'},
    {id:4,shortcut:'#thanks', name:'Thank You',    text:'Thank you for your time and consideration. I look forward to speaking with you. Please feel free to reach out anytime.'},
  ],
  documents: [
    {id:1,name:'LegalEdge CRM Brochure.pdf',        type:'PDF', size:'2.4 MB',views:34,created:'2026-02-01',owner:'Shailesh Bhange'},
    {id:2,name:'Enterprise Proposal Template.docx',  type:'Word',size:'1.2 MB',views:18,created:'2026-02-10',owner:'Nainika Pounikar'},
    {id:3,name:'Onboarding Guide.pdf',               type:'PDF', size:'4.1 MB',views:52,created:'2026-01-15',owner:'Gaurav Dotonde'},
    {id:4,name:'Case Study – TechCorp.pdf',          type:'PDF', size:'1.8 MB',views:28,created:'2026-03-01',owner:'Bali Dondkar'},
  ],
  blogs: [
    {id:1,title:'5 Ways CRM Improves Sales Performance',  status:'Published', author:'Shailesh Bhange', date:'2026-02-15',views:1240,category:'Sales'},
    {id:2,title:'How to Track Leads Effectively',         status:'Published', author:'Nainika Pounikar',date:'2026-02-28',views:890, category:'CRM Tips'},
    {id:3,title:'LegalEdge CRM vs Competitors',          status:'Draft',     author:'Gaurav Dotonde',  date:'2026-03-05',views:0,   category:'Product'},
    {id:4,title:'Automation Best Practices',              status:'Scheduled', author:'Bali Dondkar',    date:'2026-03-15',views:0,   category:'Automation'},
  ],
  coachingPlaylists: [
    {id:1,name:'New Sales Rep Onboarding',     videos:8, duration:'3h 20m',category:'Onboarding',owner:'Shailesh Bhange',assigned:6},
    {id:2,name:'Advanced Negotiation Skills',  videos:5, duration:'2h 10m',category:'Skills',    owner:'Gaurav Dotonde',  assigned:4},
    {id:3,name:'Product Knowledge Deep Dive',  videos:12,duration:'5h 40m',category:'Product',   owner:'Nikhil Lade',     assigned:9},
  ],
  connectedApps: [
    {name:'Gmail',            icon:'fa-envelope',  category:'Email',     status:'Connected',    since:'2026-01-01'},
    {name:'Google Calendar',  icon:'fa-calendar',  category:'Calendar',  status:'Connected',    since:'2026-01-01'},
    {name:'Slack',            icon:'fa-comment',   category:'Messaging', status:'Connected',    since:'2026-01-15'},
    {name:'Zoom',             icon:'fa-video',     category:'Video',     status:'Connected',    since:'2026-02-01'},
    {name:'WhatsApp Business',icon:'fa-phone',     category:'Messaging', status:'Not Connected',since:null},
    {name:'Razorpay',         icon:'fa-credit-card',category:'Payments', status:'Connected',    since:'2026-01-10'},
    {name:'Tally',            icon:'fa-chart-bar', category:'Accounting',status:'Not Connected',since:null},
    {name:'IndiaMART',        icon:'fa-store',     category:'Leads',     status:'Not Connected',since:null},
  ],
};
