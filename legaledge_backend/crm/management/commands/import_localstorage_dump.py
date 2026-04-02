import json
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_date, parse_datetime
from django.utils import timezone

from crm.models import (
    Meeting,
    Task,
    Activity,
    Note,
    MarketingCampaign,
    MarketingAd,
    MarketingForm,
    MarketingEvent,
    MarketingSocialPost,
    MarketingBuyerIntent,
    MarketingLeadScoring,
    DesignManagerFile,
)


class Command(BaseCommand):
    help = 'Import browser localStorage JSON dump into CRM SQLite tables.'

    def add_arguments(self, parser):
        parser.add_argument('--input', required=True, help='Path to JSON file created from JSON.stringify(localStorage)')
        parser.add_argument('--replace', action='store_true', help='Delete existing rows in target tables before import')
        parser.add_argument('--team-id', default=None, help='Optional team_id to assign to imported rows')
        parser.add_argument('--user-email', default=None, help='Optional user email to link imported rows')

    def handle(self, *args, **options):
        input_path = Path(options['input'])
        if not input_path.exists():
            raise CommandError(f'Input file not found: {input_path}')

        try:
            payload = json.loads(input_path.read_text(encoding='utf-8-sig'))
            if isinstance(payload, str):
                payload = json.loads(payload)
        except Exception as exc:
            raise CommandError(f'Failed to parse JSON file: {exc}') from exc

        if not isinstance(payload, dict):
            raise CommandError('Input JSON must be an object of localStorage key/value pairs.')

        team_id = options.get('team_id')
        user = None
        user_email = options.get('user_email')
        if user_email:
            user = get_user_model().objects.filter(email=user_email).first()
            if not user:
                raise CommandError(f'User not found for email: {user_email}')

        if options['replace']:
            self._replace_all()

        stats = {
            'meetings': 0,
            'tasks': 0,
            'activities': 0,
            'notes': 0,
            'marketing_campaigns': 0,
            'marketing_ads': 0,
            'marketing_forms': 0,
            'marketing_events': 0,
            'marketing_social': 0,
            'marketing_buyer_intent': 0,
            'marketing_lead_scoring': 0,
            'design_manager_files': 0,
        }

        meetings = self._read_array(payload, 'meetings')
        stats['meetings'] = self._import_meetings(meetings, team_id, user)

        tasks = self._read_array(payload, 'tasks')
        stats['tasks'] = self._import_tasks(tasks, team_id, user)

        activities = self._read_array(payload, 'activities')
        stats['activities'] = self._import_activities(activities, team_id, user)

        notes = self._read_array(payload, 'notes')
        stats['notes'] = self._import_notes(notes, team_id, user)

        stats['marketing_campaigns'] = self._import_payload_model(
            self._read_array(payload, 'marketing_campaigns'), MarketingCampaign, team_id, user
        )
        stats['marketing_ads'] = self._import_payload_model(
            self._read_array(payload, 'marketing_ads'), MarketingAd, team_id, user
        )
        stats['marketing_forms'] = self._import_payload_model(
            self._read_array(payload, 'marketing_forms'), MarketingForm, team_id, user
        )
        stats['marketing_events'] = self._import_payload_model(
            self._read_array(payload, 'marketing_events'), MarketingEvent, team_id, user
        )
        stats['marketing_social'] = self._import_payload_model(
            self._read_array(payload, 'marketing_social'), MarketingSocialPost, team_id, user
        )
        stats['marketing_buyer_intent'] = self._import_payload_model(
            self._read_array(payload, 'marketing_buyer_intent'), MarketingBuyerIntent, team_id, user
        )
        stats['marketing_lead_scoring'] = self._import_payload_model(
            self._read_array(payload, 'marketing_lead_scoring'), MarketingLeadScoring, team_id, user
        )
        stats['design_manager_files'] = self._import_payload_model(
            self._read_array(payload, 'design_manager_files'), DesignManagerFile, team_id, user
        )

        self.stdout.write(self.style.SUCCESS('LocalStorage import completed.'))
        for key, count in stats.items():
            self.stdout.write(f'  - {key}: {count}')

    def _replace_all(self):
        Meeting.objects.all().delete()
        Task.objects.all().delete()
        Activity.objects.all().delete()
        Note.objects.all().delete()
        MarketingCampaign.objects.all().delete()
        MarketingAd.objects.all().delete()
        MarketingForm.objects.all().delete()
        MarketingEvent.objects.all().delete()
        MarketingSocialPost.objects.all().delete()
        MarketingBuyerIntent.objects.all().delete()
        MarketingLeadScoring.objects.all().delete()
        DesignManagerFile.objects.all().delete()

    def _read_array(self, payload, key):
        raw = payload.get(key)
        if raw is None:
            return []
        if isinstance(raw, str):
            try:
                data = json.loads(raw)
            except Exception:
                return []
        else:
            data = raw
        return data if isinstance(data, list) else []

    def _import_meetings(self, rows, team_id, user):
        created = 0
        for row in rows:
            if not isinstance(row, dict):
                continue
            title = row.get('title') or 'Untitled meeting'
            date = parse_date(str(row.get('date'))) if row.get('date') else None
            time = row.get('time') or ''
            contact = row.get('contact') or ''
            exists = Meeting.objects.filter(title=title, date=date, time=time, contact=contact).exists()
            if exists:
                continue
            Meeting.objects.create(
                title=title,
                type=row.get('type') or 'Meeting',
                date=date,
                time=time,
                contact=contact,
                duration=row.get('duration') or '',
                platform=row.get('platform') or '',
                notes=row.get('notes') or '',
                team_id=row.get('teamId') or row.get('team_id') or team_id,
            )
            created += 1
        return created

    def _import_tasks(self, rows, team_id, user):
        created = 0
        for row in rows:
            if not isinstance(row, dict):
                continue
            title = row.get('title') or 'Untitled task'
            due_raw = row.get('dueDate') or row.get('due_date')
            due_date = parse_date(str(due_raw)) if due_raw else None
            status = row.get('status') or 'Pending'
            owner = row.get('owner') or ''
            exists = Task.objects.filter(title=title, due_date=due_date, status=status, owner=owner).exists()
            if exists:
                continue
            Task.objects.create(
                title=title,
                type=row.get('type') or 'Call',
                priority=row.get('priority') or 'Medium',
                due_date=due_date,
                status=status,
                owner=owner,
                related=row.get('related') or '',
                notes=row.get('notes') or '',
                team_id=row.get('teamId') or row.get('team_id') or team_id,
                assigned_to=user,
            )
            created += 1
        return created

    def _import_activities(self, rows, team_id, user):
        created = 0
        for row in rows:
            if not isinstance(row, dict):
                continue
            entity = row.get('entity') or 'activity'
            action = row.get('action') or 'created'
            detail = row.get('detail') or row.get('message') or ''
            owner = row.get('owner') or ''
            entity_id = row.get('entityId') if row.get('entityId') is not None else row.get('entity_id')
            exists = Activity.objects.filter(
                entity=entity,
                action=action,
                detail=detail,
                owner=owner,
                entity_id=entity_id,
            ).exists()
            if exists:
                continue
            activity = Activity.objects.create(
                entity=entity,
                entity_id=entity_id,
                action=action,
                detail=detail,
                owner=owner,
                team_id=row.get('teamId') or row.get('team_id') or team_id,
                user=user,
            )
            at_raw = row.get('at')
            parsed_at = parse_datetime(str(at_raw)) if at_raw else None
            if parsed_at:
                if timezone.is_naive(parsed_at):
                    parsed_at = timezone.make_aware(parsed_at, timezone.get_current_timezone())
                Activity.objects.filter(pk=activity.pk).update(at=parsed_at)
            created += 1
        return created

    def _import_notes(self, rows, team_id, user):
        created = 0
        for row in rows:
            if not isinstance(row, dict):
                continue
            local_id = str(row.get('id') or '')
            title = row.get('title') or 'Untitled note'
            if local_id and Note.objects.filter(local_id=local_id).exists():
                continue
            note = Note.objects.create(
                local_id=local_id,
                title=title,
                description=row.get('description') or '',
                owner=row.get('owner') or '',
                team_id=row.get('teamId') or row.get('team_id') or team_id,
                user=user,
            )
            created_raw = row.get('createdAt') or row.get('at')
            parsed_created = parse_datetime(str(created_raw)) if created_raw else None
            if parsed_created:
                if timezone.is_naive(parsed_created):
                    parsed_created = timezone.make_aware(parsed_created, timezone.get_current_timezone())
                Note.objects.filter(pk=note.pk).update(created_at=parsed_created, updated_at=parsed_created)
            created += 1
        return created

    def _import_payload_model(self, rows, model_cls, team_id, user):
        created = 0
        for row in rows:
            if not isinstance(row, dict):
                continue
            local_id = str(row.get('id') or '')
            if local_id and model_cls.objects.filter(local_id=local_id).exists():
                continue
            model_cls.objects.create(
                local_id=local_id,
                payload=row,
                team_id=row.get('teamId') or row.get('team_id') or team_id,
                user=user,
            )
            created += 1
        return created
