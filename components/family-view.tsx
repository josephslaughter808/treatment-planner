"use client";

import { useState } from "react";

type ChildProfile = {
  id: string;
  name: string;
  dateOfBirth: string;
  relationship: string;
};

type AuthorizedAdult = {
  id: string;
  name: string;
  email: string;
  relationship: string;
  accessLevel: "view-only" | "manage";
};

type FamilyAccessState = {
  children: ChildProfile[];
  authorizedAdults: AuthorizedAdult[];
};

const familyStorageKey = "clearpath-family-access";

export function FamilyView() {
  const [family, setFamily] = useState<FamilyAccessState>(() => readFamilyAccess());
  const [childDraft, setChildDraft] = useState({ name: "", dateOfBirth: "", relationship: "Child" });
  const [adultDraft, setAdultDraft] = useState({
    name: "",
    email: "",
    relationship: "Spouse",
    accessLevel: "view-only" as AuthorizedAdult["accessLevel"]
  });

  function updateFamily(nextFamily: FamilyAccessState) {
    setFamily(nextFamily);
    writeFamilyAccess(nextFamily);
  }

  function addChild() {
    if (!childDraft.name.trim()) {
      return;
    }

    updateFamily({
      ...family,
      children: [
        ...family.children,
        {
          id: crypto.randomUUID(),
          name: childDraft.name.trim(),
          dateOfBirth: childDraft.dateOfBirth,
          relationship: childDraft.relationship.trim() || "Child"
        }
      ]
    });
    setChildDraft({ name: "", dateOfBirth: "", relationship: "Child" });
  }

  function removeChild(id: string) {
    updateFamily({ ...family, children: family.children.filter((child) => child.id !== id) });
  }

  function addAuthorizedAdult() {
    if (!adultDraft.name.trim() || !adultDraft.email.trim()) {
      return;
    }

    updateFamily({
      ...family,
      authorizedAdults: [
        ...family.authorizedAdults,
        {
          id: crypto.randomUUID(),
          name: adultDraft.name.trim(),
          email: adultDraft.email.trim(),
          relationship: adultDraft.relationship.trim() || "Family member",
          accessLevel: adultDraft.accessLevel
        }
      ]
    });
    setAdultDraft({ name: "", email: "", relationship: "Spouse", accessLevel: "view-only" });
  }

  function removeAuthorizedAdult(id: string) {
    updateFamily({
      ...family,
      authorizedAdults: family.authorizedAdults.filter((adult) => adult.id !== id)
    });
  }

  return (
    <section className="grid family-layout">
      <article className="panel family-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Children</p>
            <h2>Add your kids</h2>
            <p>Add children who may need medical history and insurance updates managed by this account.</p>
          </div>
        </div>

        <div className="grid three-up">
          <label>
            Child name
            <input
              onChange={(event) => setChildDraft((current) => ({ ...current, name: event.target.value }))}
              value={childDraft.name}
            />
          </label>
          <label>
            Date of birth
            <input
              onChange={(event) => setChildDraft((current) => ({ ...current, dateOfBirth: event.target.value }))}
              type="date"
              value={childDraft.dateOfBirth}
            />
          </label>
          <label>
            Relationship
            <input
              onChange={(event) => setChildDraft((current) => ({ ...current, relationship: event.target.value }))}
              value={childDraft.relationship}
            />
          </label>
        </div>
        <button className="primary-button" onClick={addChild} type="button">
          Add child
        </button>

        <div className="saved-entry-list">
          {family.children.length > 0 ? (
            family.children.map((child) => (
              <div className="saved-entry-card family-member-card" key={child.id}>
                <div>
                  <p className="saved-entry-title">{child.name}</p>
                  <p className="saved-entry-subtitle">
                    {[child.relationship, child.dateOfBirth ? `DOB ${child.dateOfBirth}` : ""].filter(Boolean).join(" • ")}
                  </p>
                </div>
                <button className="edit-chip" onClick={() => removeChild(child.id)} type="button">
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="saved-empty-state">No children added yet.</p>
          )}
        </div>
      </article>

      <article className="panel family-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Authorization</p>
            <h2>Spouse or partner access</h2>
            <p>Authorize another adult to view or manage shared medical-history information.</p>
          </div>
        </div>

        <div className="grid two-up">
          <label>
            Authorized person
            <input
              onChange={(event) => setAdultDraft((current) => ({ ...current, name: event.target.value }))}
              value={adultDraft.name}
            />
          </label>
          <label>
            Email
            <input
              onChange={(event) => setAdultDraft((current) => ({ ...current, email: event.target.value }))}
              type="email"
              value={adultDraft.email}
            />
          </label>
          <label>
            Relationship
            <input
              onChange={(event) => setAdultDraft((current) => ({ ...current, relationship: event.target.value }))}
              value={adultDraft.relationship}
            />
          </label>
          <label>
            Access level
            <select
              onChange={(event) =>
                setAdultDraft((current) => ({
                  ...current,
                  accessLevel: event.target.value as AuthorizedAdult["accessLevel"]
                }))
              }
              value={adultDraft.accessLevel}
            >
              <option value="view-only">View medical history only</option>
              <option value="manage">View and help manage history</option>
            </select>
          </label>
        </div>
        <button className="primary-button" onClick={addAuthorizedAdult} type="button">
          Add authorization
        </button>

        <div className="saved-entry-list">
          {family.authorizedAdults.length > 0 ? (
            family.authorizedAdults.map((adult) => (
              <div className="saved-entry-card family-member-card" key={adult.id}>
                <div>
                  <p className="saved-entry-title">{adult.name}</p>
                  <p className="saved-entry-subtitle">
                    {adult.relationship} • {adult.email} • {adult.accessLevel === "manage" ? "Can manage" : "View only"}
                  </p>
                </div>
                <button className="edit-chip" onClick={() => removeAuthorizedAdult(adult.id)} type="button">
                  Revoke
                </button>
              </div>
            ))
          ) : (
            <p className="saved-empty-state">No spouse, partner, or adult access has been authorized yet.</p>
          )}
        </div>
      </article>
    </section>
  );
}

function readFamilyAccess(): FamilyAccessState {
  if (typeof window === "undefined") {
    return { children: [], authorizedAdults: [] };
  }

  try {
    const stored = window.localStorage.getItem(familyStorageKey);
    return stored ? (JSON.parse(stored) as FamilyAccessState) : { children: [], authorizedAdults: [] };
  } catch {
    return { children: [], authorizedAdults: [] };
  }
}

function writeFamilyAccess(family: FamilyAccessState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(familyStorageKey, JSON.stringify(family));
}
