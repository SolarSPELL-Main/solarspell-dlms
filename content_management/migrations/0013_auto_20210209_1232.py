# Generated by Django 3.0.4 on 2021-02-09 19:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content_management', '0012_auto_20201125_0012'),
    ]

    operations = [
        migrations.AlterField(
            model_name='liblayoutimage',
            name='image_group',
            field=models.PositiveSmallIntegerField(choices=[(1, 'Logo'), (2, 'Version')], default=2),
        ),
    ]
