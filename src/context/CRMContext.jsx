import { createContext, useContext, useReducer, useState, useCallback, useEffect, useRef } from 'react';
import { initialStore } from '../data/store';
import {
  permissions,
  modulePermissions,
  can as canAction,
  getPermissions,
  getModulePermissions,
  hasModuleAccess,
} from '../utils/permissions';
import { getStoredAuthUser } from '../utils/auth';
import { ACTIVITY_RETENTION_MS, getActivityTimestamp } from '../utils/activityRetention';
import {
  callsAPI,
  contactsAPI,
  leadsAPI,
  dealsAPI,
  tasksAPI,
  companiesAPI,
  ticketsAPI,
  meetingsAPI,
  activitiesAPI,
  notesAPI,
} from '../services/api';

const CRMContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ALL':
      return { ...state, ...action.payload };
    case 'ADD':
      return { ...state, [action.entity]: [...(state[action.entity] || []), action.payload] };
    case 'UPDATE':
      return {
        ...state,
        [action.entity]: (state[action.entity] || []).map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case 'DELETE':
      return {
        ...state,
        [action.entity]: (state[action.entity] || []).filter((i) => i.id !== action.id),
      };
    default:
      return state;
  }
}

const API_MAP = {
  callLogs: callsAPI,
  contacts: contactsAPI,
  leads: leadsAPI,
  deals: dealsAPI,
  tasks: tasksAPI,
  companies: companiesAPI,
  tickets: ticketsAPI,
  meetings: meetingsAPI,
  activities: activitiesAPI,
  notes: notesAPI,
};

const normalizeApiList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const normalizeActivity = (activity) => ({
  ...activity,
  entityId: activity?.entityId ?? activity?.entity_id ?? null,
  teamId: activity?.teamId ?? activity?.team_id ?? null,
});

const normalizeNote = (note) => ({
  ...note,
  localId: note?.localId ?? note?.local_id ?? '',
  teamId: note?.teamId ?? note?.team_id ?? null,
  createdAt: note?.createdAt ?? note?.created_at ?? note?.at ?? null,
  updatedAt: note?.updatedAt ?? note?.updated_at ?? null,
});

export function CRMProvider({ children }) {
  const [store, dispatch] = useReducer(reducer, initialStore);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const activityCleanupRef = useRef(new Set());
  const [currentUser, setCurrentUser] = useState(() => getStoredAuthUser());
  const [storeLoading, setStoreLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(!!currentUser); // Track if auth has been checked
  const role = currentUser?.role;

  // ──────────────────────────────────────────────────────────────────────────
  // FIX: Fetch data on login, don't skip if API fails on page refresh
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!currentUser) {
        console.log('[CRM] ⚠ No authenticated user - keeping fallback data, mark auth checked');
        setStoreLoading(false);
        setAuthChecked(true);
        return;
      }

      setStoreLoading(true);
      console.log(`[CRM] 🔄 Fetching data on ${new Date().toLocaleTimeString()} for: ${currentUser.name}`);
      
      try {
        const results = await Promise.allSettled([
          callsAPI.list().catch((e) => { throw e; }),
          contactsAPI.list().catch((e) => { throw e; }),
          leadsAPI.list().catch((e) => { throw e; }),
          dealsAPI.list().catch((e) => { throw e; }),
          tasksAPI.list().catch((e) => { throw e; }),
          companiesAPI.list().catch((e) => { throw e; }),
          ticketsAPI.list().catch((e) => { throw e; }),
          meetingsAPI.list().catch((e) => { throw e; }),
          activitiesAPI.list().catch((e) => { throw e; }),
          notesAPI.list().catch((e) => { throw e; }),
        ]);

        const updates = {};
        const entityNames = ['callLogs', 'contacts', 'leads', 'deals', 'tasks', 'companies', 'tickets', 'meetings', 'activities', 'notes'];
        let successCount = 0;
        let failureCount = 0;

        results.forEach((result, idx) => {
          const entity = entityNames[idx];
          if (result.status === 'fulfilled' && result.value !== null && result.value !== undefined) {
            const data = normalizeApiList(result.value);
            if (entity === 'activities') {
              updates[entity] = data.map(normalizeActivity);
            } else if (entity === 'notes') {
              updates[entity] = data.map(normalizeNote);
            } else {
              updates[entity] = data;
            }
            console.log(`[CRM] ✅ ${entity}: ${data.length} records loaded`);
            successCount++;
          } else {
            failureCount++;
            const errorMsg = result.reason?.message || result.reason || 'Unknown error';
            console.error(`[CRM] ❌ ${entity} failed:`, errorMsg);
          }
        });

        console.log(`[CRM] 📊 Data fetch result: ${successCount}✅ / ${failureCount}❌ (${successCount + failureCount} total)`);

        if (Object.keys(updates).length > 0) {
          console.log('[CRM] 💾 Updating store with fetched data...');
          dispatch({ type: 'SET_ALL', payload: updates });
        } else {
          console.warn('[CRM] ⚠ No data fetched - keeping fallback data from initialStore');
        }
      } catch (err) {
        console.error('[CRM] 💥 Critical error during data fetch:', err.message, err);
      } finally {
        setStoreLoading(false);
        setAuthChecked(true);  // ← Mark auth check as complete AFTER fetch
        console.log('[CRM] ✅ Auth checked, app ready to render');
      }
    };

    fetchStoreData();
  }, [currentUser]);

  const showToast = useCallback((msg, type = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const refreshEntity = useCallback(async (entity) => {
    const api = API_MAP[entity];
    if (!api?.list) {
      throw new Error(`No refresh API configured for ${entity}`);
    }

    const response = await api.list();
    const data = normalizeApiList(response);
    const normalized =
      entity === 'activities'
        ? data.map(normalizeActivity)
        : entity === 'notes'
          ? data.map(normalizeNote)
          : data;

    dispatch({ type: 'SET_ALL', payload: { [entity]: normalized } });
    return normalized;
  }, []);

  useEffect(() => {
    if (!currentUser) return undefined;

    const refreshAll = () => {
      if (document.visibilityState !== 'visible') return;

      void Promise.allSettled([
        refreshEntity('callLogs'),
        refreshEntity('contacts'),
        refreshEntity('leads'),
        refreshEntity('deals'),
        refreshEntity('tasks'),
        refreshEntity('companies'),
        refreshEntity('tickets'),
        refreshEntity('meetings'),
        refreshEntity('activities'),
        refreshEntity('notes'),
      ]);
    };

    const intervalId = window.setInterval(refreshAll, 60000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshAll();
      }
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser, refreshEntity]);

  const addRecord = useCallback(
    async (entity, payload, options = {}) => {
      console.trace(`[CRM-DEBUG] addRecord called for ${entity}`, payload);
      const shouldFallbackToLocal = options.localFallback !== false;
      const api = API_MAP[entity];
      if (api) {
        try {
          const created = await api.create(payload);
          if (!created || typeof created !== 'object') {
            throw new Error(`Empty API response for ${entity} create`);
          }
          const normalized =
            entity === 'activities'
              ? normalizeActivity(created)
              : entity === 'notes'
                ? normalizeNote(created)
                : created;
          dispatch({ type: 'ADD', entity, payload: normalized });
          return normalized;
        } catch (err) {
          console.warn(`Backend create failed for ${entity}:`, err.message);
          if (!shouldFallbackToLocal) {
            throw err;
          }
        }
      }

      if (!shouldFallbackToLocal) {
        throw new Error(`${entity} could not be created`);
      }

      const localPayload = { ...payload, id: (store[entity]?.length || 0) + (Date.now() % 10000) };
      dispatch({ type: 'ADD', entity, payload: localPayload });
      return localPayload;
    },
    [store]
  );

  const updateRecord = useCallback(async (entity, payload) => {
    const api = API_MAP[entity];
    if (api && payload.id) {
      try {
        const updated = await api.update(payload.id, payload);
        if (!updated || typeof updated !== 'object') {
          throw new Error(`Empty API response for ${entity} update`);
        }
        const normalized =
          entity === 'activities'
            ? normalizeActivity(updated)
            : entity === 'notes'
              ? normalizeNote(updated)
              : updated;
        dispatch({ type: 'UPDATE', entity, payload: normalized });
        return normalized;
      } catch (err) {
        console.warn(`Backend update failed for ${entity}:`, err.message);
      }
    }
    dispatch({ type: 'UPDATE', entity, payload });
    return payload;
  }, []);

  const deleteRecord = useCallback(async (entity, id) => {
    const api = API_MAP[entity];
    if (api) {
      try {
        await api.delete(id);
      } catch (err) {
        console.warn(`Backend delete failed for ${entity}:`, err.message);
      }
    }
    dispatch({ type: 'DELETE', entity, id });
  }, []);

  useEffect(() => {
    if (!store.activities?.length) return undefined;

    const cleanupExpiredActivities = () => {
      const now = Date.now();
      const expiredIds = store.activities
        .filter((activity) => {
          const timestamp = getActivityTimestamp(activity);
          return timestamp != null && now - timestamp > ACTIVITY_RETENTION_MS;
        })
        .map((activity) => activity.id)
        .filter((id) => id != null && !activityCleanupRef.current.has(id));

      expiredIds.forEach((id) => {
        activityCleanupRef.current.add(id);
        void deleteRecord('activities', id).finally(() => {
          activityCleanupRef.current.delete(id);
        });
      });
    };

    cleanupExpiredActivities();
    const intervalId = window.setInterval(cleanupExpiredActivities, 60000);

    return () => window.clearInterval(intervalId);
  }, [deleteRecord, store.activities]);

  const addActivity = useCallback(
    async (entry) => {
      console.trace('[CRM-DEBUG] addActivity called', entry);
      const base = typeof entry === 'string'
        ? { message: entry }
        : { ...entry };

      const payload = {
        entity: base.entity || 'activity',
        entityId: base.entityId ?? null,
        action: base.action || 'created',
        detail: base.detail || base.message || '',
        owner: base.owner || currentUser?.name || 'System',
        at: base.at || new Date().toISOString(),
        teamId: base.teamId ?? currentUser?.teamId ?? null,
      };

      try {
        const created = await activitiesAPI.create(payload);
        if (!created || typeof created !== 'object') {
          throw new Error('Empty API response for activities create');
        }
        const normalized = normalizeActivity(created);
        dispatch({ type: 'ADD', entity: 'activities', payload: normalized });
        return normalized;
      } catch (err) {
        console.warn('Backend create failed for activities:', err.message);
        const localPayload = { ...payload, id: Date.now() };
        dispatch({ type: 'ADD', entity: 'activities', payload: localPayload });
        return localPayload;
      }
    },
    [currentUser]
  );

  const addMeeting = useCallback(
    async (meeting) => {
      const meetingPayload = {
        title: meeting.title || '',
        contact: meeting.contact || '',
        date: meeting.date || '',
        time: meeting.time || '',
        platform: meeting.platform || 'zoom',
        duration: meeting.duration || '1 hour',
        notes: meeting.notes || '',
        type: meeting.type || 'Meeting',
        teamId: meeting.teamId ?? currentUser?.teamId ?? null,
      };

      const created = await addRecord('meetings', {
        ...meetingPayload,
      }, { localFallback: false });
      await addActivity({
        entity: 'meeting',
        entityId: created.id,
        action: 'created',
        detail: `Meeting ${created.title || 'scheduled'}`,
        owner: created.owner || currentUser?.name || 'System',
        at: new Date().toISOString(),
      });
      return created;
    },
    [addRecord, addActivity, currentUser]
  );

  const addTask = useCallback(
    async (task) => {
      const created = await addRecord('tasks', {
        ...task,
        teamId: task.teamId ?? currentUser?.teamId ?? null,
        assignedTo: task.assignedTo ?? currentUser?.id ?? null,
      });
      await addActivity({
        entity: 'task',
        entityId: created.id,
        action: 'created',
        detail: `Task ${created.title || 'created'}`,
        owner: created.owner || currentUser?.name || 'System',
        at: new Date().toISOString(),
      });
      return created;
    },
    [addRecord, addActivity, currentUser]
  );

  const addNote = useCallback(
    async (note) => {
      const created = await addRecord('notes', {
        localId: String(note.id || Date.now()),
        title: note.title || 'Untitled note',
        description: note.description || '',
        owner: note.owner || currentUser?.name || 'System',
        teamId: note.teamId ?? currentUser?.teamId ?? null,
      });

      await addActivity({
        entity: 'note',
        entityId: created.id,
        action: 'created',
        detail: `Note '${created.title}' created`,
        owner: created.owner,
        at: created.createdAt || new Date().toISOString(),
      });

      return created;
    },
    [addActivity, addRecord, currentUser]
  );

  const can = useCallback((action) => canAction(role, action), [role]);
  const currentPermissions = getPermissions(role);
  const canAccessModule = useCallback((module) => hasModuleAccess(role, module), [role]);
  const currentModulePermissions = getModulePermissions(role);

  return (
    <CRMContext.Provider
      value={{
        store,
        addRecord,
        refreshEntity,
        updateRecord,
        deleteRecord,
        addActivity,
        addMeeting,
        addTask,
        addNote,
        showToast,
        toast,
        currentUser,
        setCurrentUser,
        permissions,
        modulePermissions,
        currentPermissions,
        currentModulePermissions,
        can,
        canAccessModule,
        storeLoading,
        authChecked,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export const useCRM = () => {
  const ctx = useContext(CRMContext);
  if (ctx) return ctx;

  // Null-safe fallback for transient render/hot-reload edge-cases.
  return {
    store: initialStore,
    addRecord: async (_entity, payload) => payload,
    updateRecord: async (_entity, payload) => payload,
    deleteRecord: async () => true,
    addActivity: async (payload) => payload,
    addMeeting: async (payload) => payload,
    addTask: async (payload) => payload,
    addNote: async (payload) => payload,
    showToast: () => {},
    toast: null,
    currentUser: null,
    setCurrentUser: () => {},
    permissions: {},
    modulePermissions: {},
    currentPermissions: {},
    currentModulePermissions: {},
    can: () => false,
    canAccessModule: () => false,
    storeLoading: false,
    authChecked: false,
  };
};
