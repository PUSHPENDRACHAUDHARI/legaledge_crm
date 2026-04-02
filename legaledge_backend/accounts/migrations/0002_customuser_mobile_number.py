from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='mobile_number',
            field=models.CharField(blank=True, max_length=15, null=True, unique=True),
        ),
    ]
