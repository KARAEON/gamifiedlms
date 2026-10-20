<x-app-layout title="Advanced Analytics">
    <div class="space-y-6">
        <x-staff.page-heading title="Learning analytics" description="Explore performance by learner, section, topic, and assessment type." eyebrow="Evidence and insights" />

        <section class="panel p-5">
            <livewire:teacher.analytics-explorer />
        </section>
    </div>
</x-app-layout>
