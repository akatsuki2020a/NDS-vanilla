'use client';

import { Fragment, useActionState, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { saveRolesAction, type RolesState } from '@/lib/actions';
import type { Dictionary, Locale } from '@/lib/i18n';
import { PERMISSION_GROUPS, ROLES, type Matrix, type Role } from '@/lib/roles';

export default function RolesMatrix({ locale, t, initial }: { locale: Locale; t: Dictionary; initial: Matrix }) {
  const [state, formAction, pending] = useActionState<RolesState, FormData>(saveRolesAction, {});
  const [matrix, setMatrix] = useState<Matrix>(initial);
  const [done, setDone] = useState(false);
  const r = t.admin.roles;

  useEffect(() => {
    if (state.ok) setDone(true);
  }, [state]);

  const toggle = (role: Role, permission: string, on: boolean) =>
    setMatrix((m) => ({ ...m, [role]: on ? [...m[role], permission] : m[role].filter((p) => p !== permission) }));

  const toggleGroup = (role: Role, permissions: readonly string[], on: boolean) =>
    setMatrix((m) => ({
      ...m,
      [role]: on ? [...new Set([...m[role], ...permissions])] : m[role].filter((p) => !permissions.includes(p)),
    }));

  return (
    <form action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="payload" value={JSON.stringify(matrix)} />
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small" aria-label={r.title}>
            <TableHead>
              <TableRow>
                <TableCell>{r.permission}</TableCell>
                {ROLES.map((role) => (
                  <TableCell key={role} align="center">
                    {r.roles[role]}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {PERMISSION_GROUPS.map((group) => (
                <Fragment key={group.id}>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell component="th" scope="rowgroup">
                      <Typography fontWeight={700}>{r.groups[group.id]}</Typography>
                    </TableCell>
                    {ROLES.map((role) => {
                      const count = group.permissions.filter((p) => matrix[role].includes(p)).length;
                      return (
                        <TableCell key={role} align="center">
                          <Checkbox
                            checked={count === group.permissions.length}
                            indeterminate={count > 0 && count < group.permissions.length}
                            disabled={role === 'owner'}
                            onChange={(e) => toggleGroup(role, group.permissions, e.target.checked)}
                            slotProps={{ input: { 'aria-label': `${r.selectAll}: ${r.groups[group.id]} - ${r.roles[role]}` } }}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {group.permissions.map((permission) => (
                    <TableRow key={permission} hover>
                      <TableCell sx={{ paddingInlineStart: 4 }}>{r.permissions[permission as keyof typeof r.permissions]}</TableCell>
                      {ROLES.map((role) => (
                        <TableCell key={role} align="center">
                          <Checkbox
                            checked={matrix[role].includes(permission)}
                            disabled={role === 'owner'}
                            onChange={(e) => toggle(role, permission, e.target.checked)}
                            slotProps={{
                              input: { 'aria-label': `${r.permissions[permission as keyof typeof r.permissions]} - ${r.roles[role]}` },
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {r.ownerNote}
      </Typography>
      <Button type="submit" variant="contained" disabled={pending} sx={{ mt: 2 }}>
        {pending ? t.admin.settings.saving : r.save}
      </Button>
      <Snackbar open={done} autoHideDuration={4000} onClose={() => setDone(false)}>
        <Alert severity="success" variant="filled" onClose={() => setDone(false)}>
          {r.saved}
        </Alert>
      </Snackbar>
    </form>
  );
}
