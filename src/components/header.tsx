import { Avatar, AvatarImage } from "@evoapi/design-system/avatar";
import { Button } from "@evoapi/design-system/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useSidebar } from "@/contexts/SidebarContext";
import { useFetchInstance } from "@/lib/queries/instance/fetchInstance";
import { logout } from "@/lib/queries/token";

import { LanguageToggle } from "./language-toggle";
import { ModeToggle } from "./mode-toggle";

function Header({ instanceId }: { instanceId?: string }) {
  const { t } = useTranslation();
  const [logoutConfirmation, setLogoutConfirmation] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    logout();
    navigate("/manager/login");
  };

  const { data: instance } = useFetchInstance({ instanceId });
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex h-16 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 shadow-sm select-none">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger only on screens < md */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border/80 bg-sidebar-accent/30 text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-all active:scale-95 shadow-2xs"
          title="Menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {instanceId && instance ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <span className="opacity-70">Evolution Manager</span>
            <span>/</span>
            <span className="text-foreground font-semibold">{instance.profileName || instance.name}</span>
          </div>
        ) : (
          <div className="flex items-center text-sm font-semibold text-foreground">
            Evolution Manager
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {instanceId && instance && (
          <div className="mr-2 flex items-center gap-2 rounded-md bg-sidebar-accent/50 px-3 py-1.5">
            <Avatar className="h-6 w-6">
              <AvatarImage src={instance.profilePicUrl || "/assets/images/evolution-logo.png"} alt={instance.name} />
            </Avatar>
            <span className="text-sm font-medium text-sidebar-foreground">{instance.profileName || instance.name}</span>
          </div>
        )}
        <LanguageToggle />
        <ModeToggle />
        <Button
          onClick={() => setLogoutConfirmation(true)}
          variant="ghost"
          size="sm"
          className="gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          {t("header.logout.action")}
        </Button>
      </div>

      <Dialog onOpenChange={setLogoutConfirmation} open={logoutConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("header.logout.title")}</DialogTitle>
            <DialogDescription>{t("header.logout.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex items-center gap-4">
              <Button onClick={() => setLogoutConfirmation(false)} size="sm" variant="outline">
                {t("button.cancel")}
              </Button>
              <Button onClick={handleClose} variant="destructive">
                {t("header.logout.action")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

export { Header };
