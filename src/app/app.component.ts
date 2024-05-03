import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Observable, of } from "rxjs";
import { filter, switchMap } from "rxjs/operators";
import { CallService } from "./call.service";
import {
  CallInfoDialogComponents,
  DialogData,
} from "./dialog/callinfo-dialog.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {
  public isCallStarted$: Observable<boolean>;
  private peerId: string;
  dialogRef;
  @ViewChild("localVideo") localVideo: ElementRef<HTMLVideoElement>;
  @ViewChild("remoteVideo") remoteVideo: ElementRef<HTMLVideoElement>;

  constructor(public dialog: MatDialog, private callService: CallService) {}

  ngOnInit(): void {
    this.isCallStarted$ = this.callService.isCallStarted$;
    this.peerId = this.callService.initPeer();
    this.callService.localStream$
      .pipe(filter((res) => !!res))
      .subscribe(
        (stream) => (this.localVideo.nativeElement.srcObject = stream)
      );
    this.callService.remoteStream$
      .pipe(filter((res) => !!res))
      .subscribe(
        (stream) => (this.remoteVideo.nativeElement.srcObject = stream)
      );
  }

  ngOnDestroy(): void {
    this.callService.destroyPeer();
  }

  public showModal(joinCall: boolean): void {
    let dialogData: DialogData = joinCall
      ? { peerId: null, joinCall: true }
      : { peerId: this.peerId, joinCall: false };
    this.dialogRef = this.dialog.open(CallInfoDialogComponents, {
      width: "250px",
      data: dialogData,
    });

    this.dialogRef
      .afterClosed()
      .pipe(
        switchMap((peerId: string) =>
          joinCall
            ? of(this.callService.establishMediaCall(peerId))
            : of(this.callService.enableCallAnswer())
        )
      )
      .subscribe((_) => {});
  }

  public endCall() {
    this.callService.closeMediaCall();
  }
}
