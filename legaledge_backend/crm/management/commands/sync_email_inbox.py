from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from crm.email_oauth import sync_account_inbox, sync_all_active_accounts
from crm.models import UserEmailAccount


class Command(BaseCommand):
    help = 'Synchronize inbox messages for connected OAuth email accounts (cron-friendly).'

    def add_arguments(self, parser):
        parser.add_argument('--user-id', type=int, help='Sync only a specific user id.')
        parser.add_argument('--account-id', type=int, help='Sync only a specific connected account id.')
        parser.add_argument('--max-results', type=int, default=25, help='Messages per provider sync call.')

    def handle(self, *args, **options):
        user_id = options.get('user_id')
        account_id = options.get('account_id')
        max_results = int(options.get('max_results') or 25)

        if account_id:
            account = UserEmailAccount.objects.filter(id=account_id, is_active=True).first()
            if not account:
                self.stdout.write(self.style.ERROR('Connected account not found or inactive.'))
                return
            count = sync_account_inbox(account, max_results=max_results)
            self.stdout.write(self.style.SUCCESS(f'Synced {count} messages for account {account.id} ({account.email_address}).'))
            return

        if user_id:
            user = get_user_model().objects.filter(id=user_id).first()
            if not user:
                self.stdout.write(self.style.ERROR('User not found.'))
                return
            count = sync_all_active_accounts(user, max_results=max_results)
            self.stdout.write(self.style.SUCCESS(f'Synced {count} messages for user {user.email}.'))
            return

        total = 0
        users = get_user_model().objects.filter(email_accounts__is_active=True).distinct()
        for user in users:
            total += sync_all_active_accounts(user, max_results=max_results)
        self.stdout.write(self.style.SUCCESS(f'Email sync complete. Total new messages: {total}.'))

