package mcc.mymcc2;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.GridView;

import java.util.Comparator;

public class MainActivity extends AppCompatActivity
{
    private PhotoAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        adapter = new PhotoAdapter(this);
        setContentView(R.layout.activity_main);
        ((GridView) findViewById(R.id.grid)).setAdapter(adapter);
    }

    public void reload(final Comparator<Photo> comparator)
    {
        String url = ((EditText) findViewById(R.id.txtUrl)).getText().toString();
        adapter.update(url, comparator);
    }

    public void onAscending(View view)
    {
        reload(Photo.ORDER_ASCENDING);
    }

    public void onDescending(View view)
    {
        reload(Photo.ORDER_DESCENDING);
    }

    public void onRecent(View view)
    {
        reload(Photo.ORDER_RECENT);
    }
}
