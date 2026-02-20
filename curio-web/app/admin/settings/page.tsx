"use client";

import Link from "next/link";

function Card(props: {
  title: string;
  desc: string;
  href?: string;
  badge?: string;
  comingSoon?: boolean;
}) {
  const inner = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{props.title}</h2>

            {props.badge ? (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700">
                {props.badge}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-gray-600">{props.desc}</p>
        </div>

        <div
          className={[
            "rounded-xl px-3 py-2 text-sm font-semibold",
            props.comingSoon
              ? "border border-gray-200 bg-gray-50 text-gray-600"
              : "bg-gray-900 text-white",
          ].join(" ")}
        >
          {props.comingSoon ? "Manage" : "Manage →"}
        </div>
      </div>
    </div>
  );

  if (props.comingSoon || !props.href) {
    return <div className="opacity-90">{inner}</div>;
  }

  return (
    <Link href={props.href} className="block">
      {inner}
    </Link>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Settings
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Admin settings for Curio.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card
            title="Admins"
            desc="Invite admins, view invite status, and manage access."
            href="/admin/settings/admins"
          />

          <Card
            title="Email"
            desc="Transactional email settings and templates."
            comingSoon
          />

          <Card
            title="Users"
            desc="Student accounts, profiles, and account audit tools."
            comingSoon
          />

          <Card
            title="System"
            desc="Diagnostics, internal tools, and environment settings."
            comingSoon
          />
        </div>
      </div>
    </div>
  );
}
