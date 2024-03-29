# Generated by Django 3.0.4 on 2020-11-18 20:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content_management', '0010_libraryversion_metadata_types'),
    ]

    operations = [
        migrations.AddField(
            model_name='content',
            name='rights_holder',
            field=models.TextField(null=True),
        ),
        migrations.AlterField(
            model_name='liblayoutimage',
            name='image_group',
            field=models.PositiveSmallIntegerField(choices=[(1, 'Logo'), (2, 'Version')], default=3),
        ),
    ]
