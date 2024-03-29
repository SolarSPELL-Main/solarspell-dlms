# Generated by Django 3.0.4 on 2020-10-21 19:16

import content_management.models
import content_management.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('content_management', '0008_content_duplicatable'),
    ]

    operations = [
        migrations.AlterField(
            model_name='content',
            name='content_file',
            field=models.FileField(max_length=300, upload_to=content_management.models.Content.set_file_name, validators=[content_management.validators.validate_unique_filename, content_management.validators.validate_unique_file], verbose_name='File'),
        ),
        migrations.AlterField(
            model_name='content',
            name='filesize',
            field=models.FloatField(null=True),
        ),
        migrations.CreateModel(
            name='LibraryModule',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('module_name', models.CharField(max_length=300)),
                ('module_file', models.FileField(upload_to='modules/')),
                ('logo_img', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='module_logos', to='content_management.LibLayoutImage')),
            ],
        ),
        migrations.AddField(
            model_name='libraryversion',
            name='library_modules',
            field=models.ManyToManyField(blank=True, to='content_management.LibraryModule'),
        ),
    ]
