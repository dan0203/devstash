"use client";

import { useState } from "react";
import { toast } from "sonner";

import { deleteAccount } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CONFIRMATION_PHRASE = "DELETE";

export function DeleteAccountDialog() {
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  function reset() {
    setConfirmation("");
  }

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const result = await deleteAccount();

      if (!result.success) {
        toast.error(result.error ?? "Something went wrong");
      }
    } catch {
      toast.error("Something went wrong — check your connection and try again");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) reset();
      }}
    >
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Delete account
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account and all of your items and collections. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="delete-confirmation">
            Type <span className="font-semibold text-foreground">{CONFIRMATION_PHRASE}</span> to
            confirm
          </Label>
          <Input
            id="delete-confirmation"
            autoComplete="off"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={isDeleting}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmation !== CONFIRMATION_PHRASE}
          >
            {isDeleting ? "Deleting..." : "Delete account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
